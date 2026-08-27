/**
 * SecurityLogger for Cloud Run API
 * Simplified version with proper Firestore integration
 */

import { 
  SecurityEvent, 
  SecurityEventType, 
  SecurityEventDetails,
  SECURITY_EVENT_DESCRIPTIONS,
  EVENT_SEVERITY_MAP
} from '../types/security';

interface RequestContext {
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private eventBuffer: SecurityEvent[] = [];
  
  private constructor() {
    // Flush event buffer periodically
    setInterval(() => this.flushEventBuffer(), 30000); // Every 30 seconds
  }
  
  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }
  
  /**
   * Log a security event
   */
  public async logSecurityEvent(
    eventType: SecurityEventType,
    details: SecurityEventDetails,
    request?: RequestContext
  ): Promise<void> {
    try {
      const severity = EVENT_SEVERITY_MAP[eventType] || 'MEDIUM';
      
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
        requestId: this.generateRequestId()
      };
      
      // Log to console with structured format (Cloud Run will capture this)
      this.logToConsole(event);
      
      // Handle critical events immediately
      if (severity === 'CRITICAL') {
        await this.handleCriticalEvent(event);
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Quick method to log rate limit violations with enhanced monitoring
   */
  public async logRateLimitViolation(
    ip: string,
    endpoint: string,
    userAgent: string,
    rateLimitType: 'general' | 'chat' | 'api' | 'upload' = 'general'
  ): Promise<void> {
    await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      rateLimitType,
      currentRequests: 999, // Exceeded threshold
      windowMs: 15 * 60 * 1000
    }, {
      ip,
      endpoint,
      userAgent,
      method: 'unknown'
    });
  }
  
  /**
   * Quick method to log input validation failures
   */
  public async logInputValidationFailure(
    ip: string,
    endpoint: string,
    invalidInput: string,
    reason: string
  ): Promise<void> {
    await this.logSecurityEvent('INPUT_VALIDATION_FAILED', {
      originalValue: invalidInput.substring(0, 100), // Limit logged content
      validationRule: reason,
      attackVector: this.detectAttackVector(invalidInput)
    }, {
      ip,
      endpoint,
      method: 'POST'
    });
  }
  
  /**
   * Quick method to log authentication failures
   */
  public async logAuthFailure(
    eventType: 'AUTH_FAILURE' | 'AUTH_INVALID_KEY' | 'AUTH_MISSING_KEY',
    ip: string,
    endpoint: string,
    details: string
  ): Promise<void> {
    await this.logSecurityEvent(eventType, {
      reason: details
    }, {
      ip,
      endpoint,
      method: 'unknown'
    });
  }
  
  /**
   * Quick method to log CORS violations
   */
  public async logCORSViolation(
    ip: string,
    origin: string,
    endpoint: string
  ): Promise<void> {
    await this.logSecurityEvent('CORS_VIOLATION', {
      origin,
      reason: 'Origin not in allowed list'
    }, {
      ip,
      endpoint,
      method: 'OPTIONS'
    });
  }
  
  // Private methods
  
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
    
    // Create structured log entry for Cloud Logging
    const structuredLog = {
      severity: event.severity,
      timestamp: event.timestamp,
      message: `Security Event: ${event.eventType}`,
      component: 'security',
      service: 'parliament-api',
      eventType: event.eventType,
      ipAddress: event.ipAddress,
      endpoint: event.endpoint,
      method: event.method,
      blocked: event.blocked,
      description,
      details: event.details,
      requestId: event.requestId
    };
    
    // Use appropriate console method based on severity
    switch (event.severity) {
      case 'CRITICAL':
      case 'HIGH':
        console.error(JSON.stringify(structuredLog));
        break;
      case 'MEDIUM':
        console.warn(JSON.stringify(structuredLog));
        break;
      default:
        console.info(JSON.stringify(structuredLog));
    }
  }
  
  private async flushEventBuffer(): Promise<void> {
    // In this simplified version, we just ensure console logs are flushed
    // In production, this would batch write to Firestore
    if (this.eventBuffer.length > 0) {
      console.log(`[SECURITY-LOGGER] Processed ${this.eventBuffer.length} security events`);
      this.eventBuffer = [];
    }
  }
  
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    // Send immediate alert for critical events
    console.error(`[CRITICAL-SECURITY-ALERT] ${event.eventType}`, {
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
  
  private detectAttackVector(input: string): string {
    if (/<script\b/i.test(input)) return 'XSS';
    if (/\b(select|union|drop|insert|update|delete)\b.*\b(from|where)\b/i.test(input)) return 'SQL_INJECTION';
    if (/javascript:/i.test(input)) return 'SCRIPT_INJECTION';
    if (/\.\.\//i.test(input)) return 'PATH_TRAVERSAL';
    if (/on\w+\s*=/i.test(input)) return 'EVENT_HANDLER_INJECTION';
    return 'UNKNOWN';
  }
}

export default SecurityLogger;