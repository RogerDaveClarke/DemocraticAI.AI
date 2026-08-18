/**
 * Simple local API server for testing security features
 * This is a minimal version to test our security implementations
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(compression());

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Secure CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Simple security event logger for test server
function logSecurityEvent(eventType, ip, endpoint, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    severity: getSeverity(eventType),
    ipAddress: ip,
    endpoint,
    blocked: true,
    details,
    component: 'security-test-server'
  };
  
  console.log(`[SECURITY-EVENT] ${JSON.stringify(logEntry)}`);
}

function getSeverity(eventType) {
  const highSeverity = ['RATE_LIMIT_EXCEEDED', 'AUTH_INVALID_KEY', 'INPUT_VALIDATION_FAILED'];
  return highSeverity.includes(eventType) ? 'HIGH' : 'MEDIUM';
}

// Rate limiting middleware with logging
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(
      'RATE_LIMIT_EXCEEDED',
      req.ip,
      req.originalUrl,
      { rateLimitType: 'general', maxRequests: 100, windowMs: 15 * 60 * 1000 }
    );
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(
      'RATE_LIMIT_CHAT_EXCEEDED',
      req.ip,
      req.originalUrl,
      { rateLimitType: 'chat', maxRequests: 20, windowMs: 15 * 60 * 1000 }
    );
    
    res.status(429).json({
      error: 'Too many chat requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Apply general rate limiting
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));

// API Key validation middleware with logging
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKeys = process.env.VALID_API_KEYS?.split(',') || ['dev-test-key-12345'];
  
  // In development, allow requests without API key
  if (process.env.NODE_ENV === 'development' && !apiKey) {
    return next();
  }
  
  if (!apiKey) {
    logSecurityEvent(
      'AUTH_MISSING_KEY',
      req.ip,
      req.originalUrl,
      { reason: 'No API key provided in X-API-Key header' }
    );
    
    return res.status(401).json({ 
      error: 'Invalid or missing API key',
      message: 'Please provide a valid X-API-Key header'
    });
  }
  
  if (!validKeys.includes(apiKey)) {
    logSecurityEvent(
      'AUTH_INVALID_KEY',
      req.ip,
      req.originalUrl,
      { 
        reason: 'Invalid API key provided',
        providedKey: apiKey.substring(0, 8) + '...' // Log partial key for debugging
      }
    );
    
    return res.status(401).json({ 
      error: 'Invalid or missing API key',
      message: 'Please provide a valid X-API-Key header'
    });
  }
  
  // Log successful authentication
  logSecurityEvent(
    'AUTH_SUCCESS',
    req.ip,
    req.originalUrl,
    { reason: 'Valid API key provided' }
  );
  
  next();
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Parliament Explorer Security Test API',
    version: '1.0.0',
    status: 'online',
    security: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for general API
app.get('/api/members', (req, res) => {
  res.json({
    message: 'Members endpoint working',
    security: 'headers applied',
    rateLimit: 'active'
  });
});

// Input validation function
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 2000);
}

function validateQueryInput(input) {
  if (!input || typeof input !== 'string' || input.length < 3) {
    return false;
  }
  
  const suspiciousPatterns = [
    /\bselect\b.*\bfrom\b/i,
    /\bunion\b.*\bselect\b/i,
    /\bdrop\b.*\btable\b/i,
    /<script\b/i,
    /javascript:/i,
    /<iframe\b/i,
    /on\w+\s*=/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(input));
}

// Chat endpoints with security
app.use('/api/chat', chatLimiter, validateApiKey);

app.post('/api/chat', (req, res) => {
  const { query } = req.body;
  
  // Input validation
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({
      error: 'Invalid query',
      message: 'Query must be a string with at least 3 characters'
    });
  }
  
  if (query.length > 2000) {
    return res.status(400).json({
      error: 'Query too long',
      message: 'Query must be less than 2000 characters'
    });
  }
  
  const sanitizedQuery = sanitizeInput(query);
  if (!validateQueryInput(sanitizedQuery)) {
    logSecurityEvent(
      'INPUT_VALIDATION_FAILED',
      req.ip,
      req.originalUrl,
      { 
        originalInput: query.substring(0, 100),
        sanitizedInput: sanitizedQuery.substring(0, 100),
        reason: 'Malicious content detected in query'
      }
    );
    
    return res.status(400).json({
      error: 'Invalid query content',
      message: 'Query contains invalid or suspicious content'
    });
  }
  
  // Mock response
  res.json({
    message: 'Chat endpoint working with security',
    sanitizedQuery,
    security: {
      inputValidated: true,
      rateLimited: true,
      authenticated: true
    }
  });
});

app.post('/api/chat/feedback', validateApiKey, (req, res) => {
  res.json({
    message: 'Feedback endpoint working',
    security: 'authenticated'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🔒 Security Test API Server running on port ${port}`);
  console.log(`🛡️ Security features enabled:`);
  console.log(`   ✅ Helmet security headers`);
  console.log(`   ✅ CORS restrictions`);
  console.log(`   ✅ Rate limiting (100 general, 20 chat per 15min)`);
  console.log(`   ✅ API key authentication`);
  console.log(`   ✅ Input validation and sanitization`);
  console.log(`   ✅ Request size limits (10MB)`);
  console.log(`\n🧪 Test with: npm run test:security http://localhost:${port}`);
});

export default app;