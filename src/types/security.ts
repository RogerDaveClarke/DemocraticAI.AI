/**
 * Security Event Types and Interfaces
 * Comprehensive security logging system for Parliament Explorer
 */

export interface SecurityEvent {
  timestamp: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  details: SecurityEventDetails;
  blocked: boolean;
  sessionId?: string;
  userId?: string;
  location?: {
    country: string;
    region: string;
    city?: string;
  };
  requestId?: string;
  responseCode?: number;
  executionTime?: number;
}

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityEventType = 
  // Authentication & Authorization
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_INVALID_KEY'
  | 'AUTH_MISSING_KEY'
  | 'AUTH_EXPIRED_KEY'
  | 'AUTH_UNAUTHORIZED_ACCESS'
  
  // Rate Limiting
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_CHAT_EXCEEDED'
  | 'RATE_LIMIT_API_EXCEEDED'
  | 'RATE_LIMIT_WARNING'
  
  // Input Validation & Attacks
  | 'INPUT_VALIDATION_FAILED'
  | 'XSS_ATTEMPT_BLOCKED'
  | 'SQL_INJECTION_BLOCKED'
  | 'SCRIPT_INJECTION_BLOCKED'
  | 'PATH_TRAVERSAL_BLOCKED'
  | 'COMMAND_INJECTION_BLOCKED'
  
  // CORS & Network Security
  | 'CORS_VIOLATION'
  | 'CORS_PREFLIGHT_BLOCKED'
  | 'SUSPICIOUS_REQUEST'
  | 'LARGE_PAYLOAD_BLOCKED'
  | 'MALFORMED_REQUEST'
  
  // System Security
  | 'SECURITY_HEADER_MISSING'
  | 'SECURITY_HEADER_INVALID'
  | 'TLS_CERTIFICATE_ERROR'
  | 'FIREWALL_BLOCK'
  | 'DDoS_ATTEMPT_DETECTED'
  
  // Application Security
  | 'SENSITIVE_DATA_ACCESS'
  | 'ADMIN_ACCESS_ATTEMPT'
  | 'PRIVILEGE_ESCALATION_ATTEMPT'
  | 'DATA_EXFILTRATION_ATTEMPT'
  
  // Bot & Automation Detection
  | 'BOT_DETECTED'
  | 'AUTOMATED_ATTACK'
  | 'SCRAPING_ATTEMPT'
  | 'SUSPICIOUS_USER_AGENT';

export interface SecurityEventDetails {
  // Attack details
  attackVector?: string;
  maliciousPayload?: string;
  blockedContent?: string;
  
  // Rate limiting details
  rateLimitType?: 'general' | 'chat' | 'api' | 'upload';
  windowMs?: number;
  maxRequests?: number;
  currentRequests?: number;
  
  // Request details
  headers?: Record<string, string>;
  queryParams?: Record<string, any>;
  bodySize?: number;
  contentType?: string;
  
  // Validation details
  validationRule?: string;
  invalidFields?: string[];
  sanitizedValue?: string;
  originalValue?: string;
  
  // Context details
  referrer?: string;
  origin?: string;
  forwardedFor?: string;
  realIp?: string;
  
  // Error details
  errorMessage?: string;
  stackTrace?: string;
  
  // Additional metadata
  [key: string]: any;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  blockedRequests: number;
  topAttackTypes: Array<{
    type: SecurityEventType;
    count: number;
    percentage: number;
  }>;
  topAttackingIPs: Array<{
    ip: string;
    count: number;
    eventTypes: SecurityEventType[];
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  eventCount: number;
  events: SecurityEvent[];
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  assignee?: string;
  notes?: string[];
}

// Security event descriptions for better logging
export const SECURITY_EVENT_DESCRIPTIONS: Record<SecurityEventType, string> = {
  // Authentication & Authorization
  'AUTH_SUCCESS': 'User authentication successful',
  'AUTH_FAILURE': 'User authentication failed',
  'AUTH_INVALID_KEY': 'Invalid API key provided',
  'AUTH_MISSING_KEY': 'Missing API key in request',
  'AUTH_EXPIRED_KEY': 'Expired API key used',
  'AUTH_UNAUTHORIZED_ACCESS': 'Unauthorized access attempt',
  
  // Rate Limiting
  'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded for IP',
  'RATE_LIMIT_CHAT_EXCEEDED': 'Chat rate limit exceeded',
  'RATE_LIMIT_API_EXCEEDED': 'API rate limit exceeded',
  'RATE_LIMIT_WARNING': 'Rate limit warning threshold reached',
  
  // Input Validation & Attacks
  'INPUT_VALIDATION_FAILED': 'Malicious input detected and blocked',
  'XSS_ATTEMPT_BLOCKED': 'Cross-site scripting attack blocked',
  'SQL_INJECTION_BLOCKED': 'SQL injection attempt blocked',
  'SCRIPT_INJECTION_BLOCKED': 'Script injection attempt blocked',
  'PATH_TRAVERSAL_BLOCKED': 'Path traversal attack blocked',
  'COMMAND_INJECTION_BLOCKED': 'Command injection attempt blocked',
  
  // CORS & Network Security
  'CORS_VIOLATION': 'CORS policy violation',
  'CORS_PREFLIGHT_BLOCKED': 'CORS preflight request blocked',
  'SUSPICIOUS_REQUEST': 'Suspicious request pattern detected',
  'LARGE_PAYLOAD_BLOCKED': 'Oversized request payload blocked',
  'MALFORMED_REQUEST': 'Malformed request structure',
  
  // System Security
  'SECURITY_HEADER_MISSING': 'Required security header missing',
  'SECURITY_HEADER_INVALID': 'Invalid security header value',
  'TLS_CERTIFICATE_ERROR': 'TLS certificate validation failed',
  'FIREWALL_BLOCK': 'Request blocked by firewall rules',
  'DDoS_ATTEMPT_DETECTED': 'Potential DDoS attack detected',
  
  // Application Security
  'SENSITIVE_DATA_ACCESS': 'Attempt to access sensitive data',
  'ADMIN_ACCESS_ATTEMPT': 'Unauthorized admin access attempt',
  'PRIVILEGE_ESCALATION_ATTEMPT': 'Privilege escalation attempt',
  'DATA_EXFILTRATION_ATTEMPT': 'Potential data exfiltration attempt',
  
  // Bot & Automation Detection
  'BOT_DETECTED': 'Automated bot activity detected',
  'AUTOMATED_ATTACK': 'Automated attack pattern detected',
  'SCRAPING_ATTEMPT': 'Web scraping attempt detected',
  'SUSPICIOUS_USER_AGENT': 'Suspicious user agent string'
};

// Severity mappings for different event types
export const EVENT_SEVERITY_MAP: Record<SecurityEventType, SecuritySeverity> = {
  // Critical events requiring immediate attention
  'AUTH_UNAUTHORIZED_ACCESS': 'CRITICAL',
  'SQL_INJECTION_BLOCKED': 'CRITICAL',
  'COMMAND_INJECTION_BLOCKED': 'CRITICAL',
  'PRIVILEGE_ESCALATION_ATTEMPT': 'CRITICAL',
  'DATA_EXFILTRATION_ATTEMPT': 'CRITICAL',
  'DDoS_ATTEMPT_DETECTED': 'CRITICAL',
  
  // High severity events
  'XSS_ATTEMPT_BLOCKED': 'HIGH',
  'SCRIPT_INJECTION_BLOCKED': 'HIGH',
  'PATH_TRAVERSAL_BLOCKED': 'HIGH',
  'AUTH_INVALID_KEY': 'HIGH',
  'RATE_LIMIT_EXCEEDED': 'HIGH',
  'AUTOMATED_ATTACK': 'HIGH',
  'ADMIN_ACCESS_ATTEMPT': 'HIGH',
  
  // Medium severity events
  'INPUT_VALIDATION_FAILED': 'MEDIUM',
  'CORS_VIOLATION': 'MEDIUM',
  'AUTH_FAILURE': 'MEDIUM',
  'LARGE_PAYLOAD_BLOCKED': 'MEDIUM',
  'BOT_DETECTED': 'MEDIUM',
  'SCRAPING_ATTEMPT': 'MEDIUM',
  'SUSPICIOUS_REQUEST': 'MEDIUM',
  
  // Low severity events
  'AUTH_SUCCESS': 'LOW',
  'AUTH_MISSING_KEY': 'LOW',
  'RATE_LIMIT_WARNING': 'LOW',
  'SECURITY_HEADER_MISSING': 'LOW',
  'SUSPICIOUS_USER_AGENT': 'LOW',
  'AUTH_EXPIRED_KEY': 'LOW',
  'CORS_PREFLIGHT_BLOCKED': 'LOW',
  'MALFORMED_REQUEST': 'LOW',
  'SECURITY_HEADER_INVALID': 'LOW',
  'TLS_CERTIFICATE_ERROR': 'LOW',
  'FIREWALL_BLOCK': 'LOW',
  'SENSITIVE_DATA_ACCESS': 'LOW',
  'RATE_LIMIT_CHAT_EXCEEDED': 'MEDIUM',
  'RATE_LIMIT_API_EXCEEDED': 'MEDIUM'
};