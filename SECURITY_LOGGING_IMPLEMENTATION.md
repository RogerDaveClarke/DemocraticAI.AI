# Security Logging Implementation Guide
*Parliament Explorer - Security Event Logging Setup*

## 🚨 Current Security Logging Gaps

Your application currently uses basic console logging. For enterprise security, you need dedicated security event logging.

## 🔒 Recommended Security Logging Implementation

### **1. Security Event Types to Log**

```typescript
// Security events that should be logged
const SECURITY_EVENTS = {
  // Authentication & Authorization
  'AUTH_SUCCESS': 'User authentication successful',
  'AUTH_FAILURE': 'User authentication failed',
  'AUTH_INVALID_KEY': 'Invalid API key provided',
  'AUTH_MISSING_KEY': 'Missing API key in request',
  
  // Rate Limiting
  'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded for IP',
  'RATE_LIMIT_CHAT_EXCEEDED': 'Chat rate limit exceeded',
  
  // Input Validation
  'INPUT_VALIDATION_FAILED': 'Malicious input detected and blocked',
  'XSS_ATTEMPT_BLOCKED': 'XSS attack attempt blocked',
  'SQL_INJECTION_BLOCKED': 'SQL injection attempt blocked',
  
  // CORS & Network Security
  'CORS_VIOLATION': 'CORS policy violation',
  'SUSPICIOUS_REQUEST': 'Suspicious request pattern detected',
  'LARGE_PAYLOAD_BLOCKED': 'Oversized request payload blocked',
  
  // System Security
  'SECURITY_HEADER_MISSING': 'Required security header missing',
  'TLS_CERTIFICATE_ERROR': 'TLS certificate validation failed',
  'FIREWALL_BLOCK': 'Request blocked by firewall rules'
};
```

### **2. Enhanced Security Logger Class**

```typescript
// Create: src/utils/SecurityLogger.ts
import { Firestore } from '@google-cloud/firestore';

interface SecurityEvent {
  timestamp: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  details: any;
  blocked: boolean;
  sessionId?: string;
  userId?: string;
  location?: {
    country: string;
    region: string;
  };
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private db: Firestore;
  
  constructor() {
    this.db = new Firestore();
  }
  
  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }
  
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to Google Cloud Firestore for persistence
      await this.db.collection('security_logs').add({
        ...event,
        timestamp: new Date().toISOString()
      });
      
      // Also log to Cloud Logging for real-time monitoring
      console.log(`[SECURITY-EVENT] ${event.eventType}`, {
        severity: event.severity,
        ip: event.ipAddress,
        endpoint: event.endpoint,
        blocked: event.blocked,
        details: event.details
      });
      
      // For critical events, send alerts
      if (event.severity === 'CRITICAL') {
        await this.sendSecurityAlert(event);
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implement alerting logic (email, Slack, etc.)
    console.error(`[CRITICAL-SECURITY-ALERT] ${event.eventType}`, event);
  }
}

export default SecurityLogger;
```

### **3. Middleware Integration**

```typescript
// Update: cloud-run-api/src/securityMiddleware.ts
import SecurityLogger from '../utils/SecurityLogger.js';

const securityLogger = SecurityLogger.getInstance();

// Rate limiting with logging
export const securityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Rate limit exceeded' },
  onLimitReached: async (req, res) => {
    await securityLogger.logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'HIGH',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      endpoint: req.originalUrl,
      method: req.method,
      details: {
        rateLimitType: 'general',
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
      },
      blocked: true
    });
  }
});

// Input validation with logging
export const validateAndLogInput = async (req, res, next) => {
  const { query } = req.body;
  
  if (!validateQueryInput(query)) {
    await securityLogger.logSecurityEvent({
      eventType: 'INPUT_VALIDATION_FAILED',
      severity: 'HIGH',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      endpoint: req.originalUrl,
      method: req.method,
      details: {
        invalidInput: query,
        reason: 'Malicious pattern detected'
      },
      blocked: true
    });
    
    return res.status(400).json({
      error: 'Invalid input detected'
    });
  }
  
  next();
};
```

### **4. Google Cloud Logging Setup**

Add structured logging configuration:

```typescript
// Create: cloud-run-api/src/utils/CloudLogger.ts
import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const log = logging.log('parliament-security');

export const logSecurityEventToCloud = async (event: any) => {
  const metadata = {
    resource: { type: 'cloud_run_revision' },
    severity: event.severity,
    labels: {
      component: 'security',
      event_type: event.eventType
    }
  };
  
  const entry = log.entry(metadata, event);
  await log.write(entry);
};
```

## 📊 Security Log Analysis & Monitoring

### **1. Log Query Examples**

```bash
# View all security events
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.component="security"' --limit=100

# Critical security events only
gcloud logging read 'resource.type="cloud_run_revision" AND severity="CRITICAL"' --limit=50

# Rate limiting violations
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.eventType="RATE_LIMIT_EXCEEDED"' --limit=50

# Input validation blocks
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.eventType="INPUT_VALIDATION_FAILED"' --limit=50
```

### **2. Security Dashboard Queries**

```sql
-- Top attacking IPs (BigQuery)
SELECT 
  jsonPayload.ipAddress as ip,
  COUNT(*) as attack_count,
  ARRAY_AGG(DISTINCT jsonPayload.eventType) as event_types
FROM `your-project.cloud_logging.parliament_security_*`
WHERE jsonPayload.blocked = true
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY ip
ORDER BY attack_count DESC
LIMIT 20;
```

## 🚨 Security Alerting Setup

### **1. Create Log-Based Metrics**

```bash
# Create metric for critical security events
gcloud logging metrics create critical_security_events \
  --description="Critical security events requiring immediate attention" \
  --log-filter='resource.type="cloud_run_revision" AND severity="CRITICAL" AND jsonPayload.component="security"'

# Create metric for rate limit violations
gcloud logging metrics create rate_limit_violations \
  --description="Rate limit violations per minute" \
  --log-filter='resource.type="cloud_run_revision" AND jsonPayload.eventType="RATE_LIMIT_EXCEEDED"'
```

### **2. Monitoring Alerts**

```bash
# Create alerting policy for critical events
gcloud alpha monitoring policies create \
  --policy-from-file=security-alert-policy.yaml
```

## 📋 Implementation Checklist

- [ ] Create SecurityLogger class with Firestore integration
- [ ] Add structured logging to all security middleware
- [ ] Implement Google Cloud Logging integration
- [ ] Set up log-based metrics in Cloud Monitoring
- [ ] Create alerting policies for critical security events
- [ ] Build security dashboard for monitoring
- [ ] Configure log retention policies
- [ ] Set up automated threat analysis

## 🎯 Current Status

**✅ Basic Console Logging**: Working for development
**❌ Structured Security Logging**: Not implemented
**❌ Persistent Security Logs**: Not configured
**❌ Security Event Alerting**: Not set up
**❌ Security Analytics**: Not available

## 🚀 Next Steps

1. **Immediate**: Implement SecurityLogger class
2. **Short-term**: Add security event logging to middleware
3. **Medium-term**: Set up Cloud Logging integration and alerting
4. **Long-term**: Build comprehensive security monitoring dashboard

Your security implementations are solid, but adding proper logging will provide visibility into attacks and help with compliance requirements.