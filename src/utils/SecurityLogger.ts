/**
 * SecurityLogger - Comprehensive security event logging system
 * Parliament Explorer Security Implementation
 */

import { Firestore } from '@google-cloud/firestore';
import { 
  SecurityEvent, 
  SecurityEventType, 
  SecuritySeverity, 
  SecurityEventDetails,
  SecurityMetrics,
  SecurityAlert,
  SECURITY_EVENT_DESCRIPTIONS,
  EVENT_SEVERITY_MAP
} from '../types/security.js';

interface SecurityLoggerConfig {
  projectId?: string;
  enableFirestore?: boolean;
  enableCloudLogging?: boolean;
  enableConsoleLogging?: boolean;
  logLevel?: SecuritySeverity;
  alertThresholds?: {
    criticalEvents: number;
    timeWindowMs: number;
  };
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private db: Firestore | null = null;
  private config: SecurityLoggerConfig;
  private eventBuffer: SecurityEvent[] = [];
  private alertBuffer: Map<string, number> = new Map();
  
  private constructor(config: SecurityLoggerConfig = {}) {
    this.config = {
      enableFirestore: true,
      enableCloudLogging: true,
      enableConsoleLogging: true,
      logLevel: 'LOW',
      alertThresholds: {
        criticalEvents: 5,
        timeWindowMs: 5 * 60 * 1000 // 5 minutes
      },
      ...config
    };
    
    if (this.config.enableFirestore) {
      try {
        this.db = new Firestore();
      } catch (error) {
        console.error('Failed to initialize Firestore for security logging:', error);
        this.config.enableFirestore = false;
      }
    }
    
    // Flush event buffer periodically
    setInterval(() => this.flushEventBuffer(), 30000); // Every 30 seconds
    
    // Clean up old alert counters
    setInterval(() => this.cleanupAlertBuffer(), 60000); // Every minute
  }
  
  public static getInstance(config?: SecurityLoggerConfig): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger(config);
    }
    return SecurityLogger.instance;
  }
  
  /**
   * Log a security event
   */
  public async logSecurityEvent(
    eventType: SecurityEventType,
    details: SecurityEventDetails,
    request?: {
      ip?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
      headers?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      const severity = EVENT_SEVERITY_MAP[eventType] || 'MEDIUM';
      
      // Skip if below configured log level
      if (!this.shouldLog(severity)) {
        return;
      }
      
      const event: SecurityEvent = {
        timestamp: new Date().toISOString(),
        eventType,
        severity,
        ipAddress: request?.ip || 'unknown',
        userAgent: request?.userAgent || 'unknown',
        endpoint: request?.endpoint || 'unknown',
        method: request?.method || 'unknown',
        details,
        blocked: this.isBlockingEvent(eventType),
        requestId: this.generateRequestId(),
        ...this.extractLocationFromIP(request?.ip)
      };
      
      // Log to console if enabled
      if (this.config.enableConsoleLogging) {
        this.logToConsole(event);
      }
      
      // Add to buffer for batch processing
      this.eventBuffer.push(event);
      
      // Handle critical events immediately
      if (severity === 'CRITICAL') {
        await this.handleCriticalEvent(event);
      }
      
      // Check for alert conditions
      await this.checkAlertConditions(event);
      
      // Flush buffer if it's getting large
      if (this.eventBuffer.length >= 50) {
        await this.flushEventBuffer();
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Get security metrics for a time range
   */
  public async getSecurityMetrics(
    startTime: Date, 
    endTime: Date = new Date()
  ): Promise<SecurityMetrics> {
    if (!this.db) {
      throw new Error('Firestore not available for metrics');
    }
    
    try {
      const query = this.db
        .collection('security_logs')
        .where('timestamp', '>=', startTime.toISOString())
        .where('timestamp', '<=', endTime.toISOString())
        .orderBy('timestamp', 'desc');
      
      const snapshot = await query.get();
      const events = snapshot.docs.map((doc: { data: () => unknown }) => doc.data() as SecurityEvent);
      
      return this.calculateMetrics(events, startTime, endTime);
      
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get recent security alerts
   */
  public async getSecurityAlerts(limit: number = 20): Promise<SecurityAlert[]> {
    if (!this.db) {
      return [];
    }
    
    try {
      const snapshot = await this.db
        .collection('security_alerts')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map((doc: { id: string; data: () => unknown }) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          ...data
        } as SecurityAlert;
      });
      
    } catch (error) {
      console.error('Failed to get security alerts:', error);
      return [];
    }
  }
  
  /**
   * Block IP address (if firestore is available)
   */
  public async blockIP(
    ipAddress: string, 
    reason: string, 
    duration: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<void> {
    if (!this.db) {
      console.warn('Firestore not available - IP blocking not persisted');
      return;
    }
    
    try {
      await this.db.collection('blocked_ips').doc(ipAddress).set({
        ip: ipAddress,
        reason,
        blockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration).toISOString(),
        active: true
      });
      
      await this.logSecurityEvent('FIREWALL_BLOCK', {
        blockedContent: ipAddress,
        reason,
        duration
      });
      
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }
  
  /**
   * Check if IP is blocked
   */
  public async isIPBlocked(ipAddress: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }
    
    try {
      const doc = await this.db.collection('blocked_ips').doc(ipAddress).get();
      
      if (!doc.exists) {
        return false;
      }
      
      const data = doc.data();
      const expiresAt = new Date(data?.expiresAt);
      
      if (expiresAt < new Date()) {
        // Expired block - remove it
        await doc.ref.delete();
        return false;
      }
      
      return data?.active === true;
      
    } catch (error) {
      console.error('Failed to check IP block status:', error);
      return false;
    }
  }
  
  // Private methods
  
  private shouldLog(severity: SecuritySeverity): boolean {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const configLevel = levels.indexOf(this.config.logLevel || 'LOW');
    const eventLevel = levels.indexOf(severity);
    return eventLevel >= configLevel;
  }
  
  private isBlockingEvent(eventType: SecurityEventType): boolean {
    const blockingEvents = [
      'XSS_ATTEMPT_BLOCKED',
      'SQL_INJECTION_BLOCKED',
      'SCRIPT_INJECTION_BLOCKED',
      'PATH_TRAVERSAL_BLOCKED',
      'COMMAND_INJECTION_BLOCKED',
      'RATE_LIMIT_EXCEEDED',
      'LARGE_PAYLOAD_BLOCKED',
      'AUTH_INVALID_KEY',
      'CORS_VIOLATION'
    ];
    return blockingEvents.includes(eventType);
  }
  
  private logToConsole(event: SecurityEvent): void {
    const description = SECURITY_EVENT_DESCRIPTIONS[event.eventType];
    const logLevel = event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'error' : 'log';
    
    console[logLevel](`[SECURITY-${event.severity}] ${event.eventType}: ${description}`, {
      ip: event.ipAddress,
      endpoint: event.endpoint,
      blocked: event.blocked,
      timestamp: event.timestamp,
      details: event.details
    });
  }
  
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0 || !this.config.enableFirestore || !this.db) {
      return;
    }
    
    try {
      const batch = this.db.batch();
      const events = [...this.eventBuffer];
      this.eventBuffer = [];
      
      events.forEach(event => {
        const docRef = this.db!.collection('security_logs').doc();
        batch.set(docRef, event);
      });
      
      await batch.commit();
      
      if (this.config.enableConsoleLogging) {
        console.log(`[SECURITY-LOGGER] Flushed ${events.length} security events to Firestore`);
      }
      
    } catch (error) {
      console.error('Failed to flush security events to Firestore:', error);
      // Put events back in buffer for retry
      this.eventBuffer.unshift(...this.eventBuffer);
    }
  }
  
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      // Create security alert
      if (this.db) {
        const alert: Omit<SecurityAlert, 'id'> = {
          timestamp: event.timestamp,
          title: `Critical Security Event: ${event.eventType}`,
          description: SECURITY_EVENT_DESCRIPTIONS[event.eventType],
          severity: 'CRITICAL',
          eventCount: 1,
          events: [event],
          status: 'OPEN'
        };
        
        await this.db.collection('security_alerts').add(alert);
      }
      
      // Send immediate notification
      await this.sendSecurityAlert(event);
      
    } catch (error) {
      console.error('Failed to handle critical security event:', error);
    }
  }
  
  private async checkAlertConditions(event: SecurityEvent): Promise<void> {
    const key = `${event.eventType}_${event.ipAddress}`;
    const current = this.alertBuffer.get(key) || 0;
    this.alertBuffer.set(key, current + 1);
    
    // Check if we've exceeded the threshold
    if (current + 1 >= (this.config.alertThresholds?.criticalEvents || 5)) {
      await this.createAlert(event, current + 1);
    }
  }
  
  private async createAlert(event: SecurityEvent, eventCount: number): Promise<void> {
    if (!this.db) return;
    
    try {
      const alert: Omit<SecurityAlert, 'id'> = {
        timestamp: new Date().toISOString(),
        title: `Repeated Security Events: ${event.eventType}`,
        description: `${eventCount} instances of ${SECURITY_EVENT_DESCRIPTIONS[event.eventType]} from ${event.ipAddress}`,
        severity: event.severity,
        eventCount,
        events: [event],
        status: 'OPEN'
      };
      
      await this.db.collection('security_alerts').add(alert);
      
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }
  
  private cleanupAlertBuffer(): void {
    // This is a simple implementation - in production you'd want more sophisticated cleanup
    if (this.alertBuffer.size > 1000) {
      this.alertBuffer.clear();
    }
  }
  
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implement your alerting logic here (email, Slack, webhook, etc.)
    console.error(`🚨 [CRITICAL-SECURITY-ALERT] ${event.eventType}`, {
      description: SECURITY_EVENT_DESCRIPTIONS[event.eventType],
      severity: event.severity,
      ip: event.ipAddress,
      endpoint: event.endpoint,
      timestamp: event.timestamp,
      blocked: event.blocked,
      details: event.details
    });
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private extractLocationFromIP(ip?: string): Partial<SecurityEvent> {
    // This is a placeholder - in production you'd integrate with a GeoIP service
    if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
      return {};
    }
    
    return {
      location: {
        country: 'Unknown',
        region: 'Unknown'
      }
    };
  }
  
  private calculateMetrics(
    events: SecurityEvent[], 
    startTime: Date, 
    endTime: Date
  ): SecurityMetrics {
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
    const highSeverityEvents = events.filter(e => e.severity === 'HIGH').length;
    const blockedRequests = events.filter(e => e.blocked).length;
    
    // Calculate top attack types
    const attackTypes = new Map<SecurityEventType, number>();
    events.forEach(event => {
      const current = attackTypes.get(event.eventType) || 0;
      attackTypes.set(event.eventType, current + 1);
    });
    
    const topAttackTypes = Array.from(attackTypes.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / totalEvents) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate top attacking IPs
    const attackingIPs = new Map<string, SecurityEventType[]>();
    events.filter(e => e.blocked).forEach(event => {
      const current = attackingIPs.get(event.ipAddress) || [];
      if (!current.includes(event.eventType)) {
        current.push(event.eventType);
      }
      attackingIPs.set(event.ipAddress, current);
    });
    
    const topAttackingIPs = Array.from(attackingIPs.entries())
      .map(([ip, eventTypes]) => ({
        ip,
        count: eventTypes.length,
        eventTypes
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      blockedRequests,
      topAttackTypes,
      topAttackingIPs,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      }
    };
  }
}

export default SecurityLogger;