# Security Recommendations for Parliament Explorer

## ðŸš¨ Critical Security Issues to Fix

### 1. CORS Configuration
**Issue:** API allows all origins (`origin: '*'`)
**Risk:** Cross-site request forgery, data theft
**Fix:**
```typescript
// In cloud-run-api/src/index.ts
app.use(cors({
  origin: [
    'https://your-production-domain.com',
    'http://localhost:5173' // Development only
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### 2. Add Security Headers
**Add to index.html:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://<YOUR_API_SERVICE_HOST> https://*.supabase.co; img-src 'self' data: https:;">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
```

### 3. Input Validation & Sanitization
**Add to chat functionality:**
```typescript
// Create validation utility
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 1000); // Limit length
}

// In Enquire.tsx
const handleSendMessage = async () => {
  const sanitizedQuery = sanitizeInput(query);
  if (!sanitizedQuery || sanitizedQuery.length < 3) {
    return; // Reject invalid input
  }
  // ... rest of function
};
```

### 4. Rate Limiting
**Add to API:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 5. API Authentication
**Add API key validation:**
```typescript
const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!apiKey || !validKeys.includes(apiKey as string)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Apply to sensitive endpoints
app.use('/api/chat/', validateApiKey);
```

## ðŸ” Medium Priority Fixes

### 1. Environment Variables Security
- Create `.env.example` with dummy values
- Add `.env*` to `.gitignore`
- Use proper secret management in production

### 2. Error Handling
```typescript
// Don't expose internal errors
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error); // Log internally
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.headers['x-request-id'] 
  });
});
```

### 3. Request Size Limits
```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 4. Secure Headers Middleware
```typescript
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://<YOUR_API_SERVICE_HOST>"]
    }
  }
}));
```

## ðŸ§ª Security Testing Tools You Can Use

### Frontend Security
```bash
# Install security auditing tools
npm install --save-dev eslint-plugin-security
npm audit
```

### API Security Testing
```bash
# Install OWASP ZAP for API security testing
# Or use online tools like:
# - Postman security tests
# - Insomnia security scanning
```

## âœ… Current Good Practices

1. âœ… Using HTTPS for all external APIs
2. âœ… No hardcoded secrets in source code
3. âœ… Environment variables for configuration
4. âœ… No dangerous DOM manipulation (innerHTML, eval)
5. âœ… Proper React rendering (prevents XSS)
6. âœ… Supabase integration with proper keys

## ðŸ“‹ Security Checklist

- [ ] Fix CORS policy to specific domains
- [ ] Add CSP headers
- [ ] Implement input validation
- [ ] Add rate limiting
- [ ] Add API authentication
- [ ] Implement proper error handling
- [ ] Add request size limits
- [ ] Set up security headers middleware
- [ ] Create environment variables documentation
- [ ] Set up security monitoring/logging

## ðŸš€ Implementation Priority

1. **Immediate (Critical):** CORS, CSP headers, input validation
2. **This Week:** Rate limiting, API authentication  
3. **Next Sprint:** Error handling, security monitoring
4. **Ongoing:** Security audits, dependency updates

