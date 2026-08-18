/**
 * Cloud Logger - Google Cloud Logging integration
 * Parliament Explorer Security Implementation
 */

import { SecurityEvent, SecuritySeverity } from '../types/security.js';

interface CloudLogEntry {
  timestamp: string;
  severity: 'DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALERT' | 'EMERGENCY';
  message: string;
  resource?: {
    type: string;
    labels?: Record<string, string>;
  };
  labels?: Record<string, string>;
  jsonPayload?: Record<string, any>;
  httpRequest?: {
    requestMethod: string;
    requestUrl: string;
    status: number;
    userAgent: string;
    remoteIp: string;
  };
}

class CloudLogger {
  private static instance: CloudLogger;
  private serviceName: string;
  
  private constructor(projectId?: string, serviceName: string = 'parliament-explorer') {
    void projectId;
    this.serviceName = serviceName;
  }
  
  public static getInstance(projectId?: string, serviceName?: string): CloudLogger {
    if (!CloudLogger.instance) {
      CloudLogger.instance = new CloudLogger(projectId, serviceName);
    }
    return CloudLogger.instance;
  }
  
  /**
   * Log security event to Google Cloud Logging
   */
  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const logEntry = this.createLogEntry(event);
      await this.writeLogEntry(logEntry);
    } catch (error) {
      console.error('Failed to log security event to Cloud Logging:', error);
    }
  }
  
  /**
   * Log structured message to Cloud Logging
   */
  public async logMessage(
    message: string,
    severity: SecuritySeverity = 'LOW',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const logEntry: CloudLogEntry = {
        timestamp: new Date().toISOString(),
        severity: this.mapSeverityToCloudLogging(severity),
        message,
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: this.serviceName,
            location: process.env.GOOGLE_CLOUD_REGION || 'us-west1'
          }
        },
        labels: {
          component: 'security',
          service: this.serviceName
        },
        jsonPayload: metadata
      };
      
      await this.writeLogEntry(logEntry);
    } catch (error) {
      console.error('Failed to log message to Cloud Logging:', error);
    }
  }
  
  /**
   * Create structured log entry for security event
   */
  private createLogEntry(event: SecurityEvent): CloudLogEntry {
    return {
      timestamp: event.timestamp,
      severity: this.mapSeverityToCloudLogging(event.severity),
      message: `Security Event: ${event.eventType} from ${event.ipAddress}`,
      resource: {
        type: 'cloud_run_revision',
        labels: {
          service_name: this.serviceName,
          location: process.env.GOOGLE_CLOUD_REGION || 'us-west1'
        }
      },
      labels: {
        component: 'security',
        event_type: event.eventType,
        severity: event.severity,
        blocked: event.blocked.toString(),
        ip_address: event.ipAddress,
        service: this.serviceName
      },
      jsonPayload: {
        eventType: event.eventType,
        severity: event.severity,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        endpoint: event.endpoint,
        method: event.method,
        blocked: event.blocked,
        details: event.details,
        sessionId: event.sessionId,
        userId: event.userId,
        location: event.location,
        requestId: event.requestId,
        responseCode: event.responseCode,
        executionTime: event.executionTime
      },
      httpRequest: {
        requestMethod: event.method,
        requestUrl: event.endpoint,
        status: event.responseCode || 0,
        userAgent: event.userAgent,
        remoteIp: event.ipAddress
      }
    };
  }
  
  /**
   * Write log entry (console fallback if Cloud Logging not available)
   */
  private async writeLogEntry(logEntry: CloudLogEntry): Promise<void> {
    // In a production environment with Google Cloud Logging SDK:
    // const logging = new Logging({ projectId: this.projectId });
    // const log = logging.log('parliament-security');
    // const entry = log.entry(logEntry);
    // await log.write(entry);
    
    // For now, use structured console logging that Cloud Run will capture
    const structuredLog = {
      severity: logEntry.severity,
      timestamp: logEntry.timestamp,
      message: logEntry.message,
      component: 'security',
      service: this.serviceName,
      ...logEntry.jsonPayload
    };
    
    // Use console methods that match Cloud Logging severity levels
    switch (logEntry.severity) {
      case 'CRITICAL':
      case 'ERROR':
        console.error(JSON.stringify(structuredLog));
        break;
      case 'WARNING':
        console.warn(JSON.stringify(structuredLog));
        break;
      case 'INFO':
      case 'NOTICE':
        console.info(JSON.stringify(structuredLog));
        break;
      default:
        console.log(JSON.stringify(structuredLog));
    }
  }
  
  /**
   * Map security severity to Cloud Logging severity
   */
  private mapSeverityToCloudLogging(severity: SecuritySeverity): CloudLogEntry['severity'] {
    switch (severity) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'ERROR';
      case 'MEDIUM':
        return 'WARNING';
      case 'LOW':
        return 'INFO';
      default:
        return 'DEFAULT';
    }
  }
  
  /**
   * Create log-based metrics (for monitoring alerts)
   */
  public getLogBasedMetricFilters(): Record<string, string> {
    return {
      'critical_security_events': 'resource.type="cloud_run_revision" AND severity="CRITICAL" AND jsonPayload.component="security"',
      'rate_limit_violations': 'resource.type="cloud_run_revision" AND jsonPayload.eventType="RATE_LIMIT_EXCEEDED"',
      'input_validation_blocks': 'resource.type="cloud_run_revision" AND jsonPayload.eventType="INPUT_VALIDATION_FAILED"',
      'auth_failures': 'resource.type="cloud_run_revision" AND jsonPayload.eventType=("AUTH_FAILURE" OR "AUTH_INVALID_KEY")',
      'xss_attacks': 'resource.type="cloud_run_revision" AND jsonPayload.eventType="XSS_ATTEMPT_BLOCKED"',
      'sql_injection_attacks': 'resource.type="cloud_run_revision" AND jsonPayload.eventType="SQL_INJECTION_BLOCKED"',
      'cors_violations': 'resource.type="cloud_run_revision" AND jsonPayload.eventType="CORS_VIOLATION"',
      'blocked_requests_by_ip': 'resource.type="cloud_run_revision" AND jsonPayload.blocked=true',
      'security_events_per_endpoint': 'resource.type="cloud_run_revision" AND jsonPayload.component="security"'
    };
  }
  
  /**
   * Get suggested alerting queries for Cloud Monitoring
   */
  public getAlertingQueries(): Record<string, { query: string; description: string; threshold: number }> {
    return {
      'high_rate_limit_violations': {
        query: 'resource.type="cloud_run_revision" AND jsonPayload.eventType="RATE_LIMIT_EXCEEDED"',
        description: 'Alert when rate limit violations exceed threshold per minute',
        threshold: 10
      },
      'critical_security_events': {
        query: 'resource.type="cloud_run_revision" AND severity="CRITICAL" AND jsonPayload.component="security"',
        description: 'Alert immediately on any critical security event',
        threshold: 1
      },
      'multiple_auth_failures': {
        query: 'resource.type="cloud_run_revision" AND jsonPayload.eventType=("AUTH_FAILURE" OR "AUTH_INVALID_KEY")',
        description: 'Alert on repeated authentication failures from same IP',
        threshold: 5
      },
      'attack_pattern_detection': {
        query: 'resource.type="cloud_run_revision" AND jsonPayload.eventType=("XSS_ATTEMPT_BLOCKED" OR "SQL_INJECTION_BLOCKED" OR "SCRIPT_INJECTION_BLOCKED")',
        description: 'Alert on detected attack patterns',
        threshold: 3
      }
    };
  }
}

export default CloudLogger;