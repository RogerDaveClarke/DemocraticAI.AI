import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local if present
if (typeof process.loadEnvFile === 'function') {
  const localEnvPath = path.resolve(process.cwd(), '.env.local');
  const parentEnvPath = path.resolve(process.cwd(), '../.env.local');
  if (fs.existsSync(localEnvPath)) {
    try { process.loadEnvFile(localEnvPath); } catch { /* Environment validation reports invalid values later. */ }
  } else if (fs.existsSync(parentEnvPath)) {
    try { process.loadEnvFile(parentEnvPath); } catch { /* Environment validation reports invalid values later. */ }
  }
}

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Firestore } from '@google-cloud/firestore';
import NodeCache from 'node-cache';
import trendingTopicsAPI from './trendingTopicsAPI';
import sentimentAnalysisAPI from './sentimentAnalysisAPI';
import memberInsightsAPI from './memberInsightsAPI';
import votingAPI from './votingAPI';
import { setupChatRoutes } from './chatAPI';
import { setupAdminRoutes } from './adminAPI';
import { setupPasswordlessAuthRoutes } from './passwordlessAuthAPI';
import SecurityLogger from './utils/SecurityLogger';
import authRoutes from './routes/auth';
import APIUsageMonitor from './utils/APIUsageMonitor';
import { validateEnvironment, logValidationResults } from './utils/envValidation';

// Validate environment variables before starting the server
const envValidation = validateEnvironment();
logValidationResults(envValidation);

// Initialize Firestore
const db = new Firestore();

// Initialize cache (TTL in seconds)
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60 // Check for expired keys every minute
});

// Initialize Security Logger and Usage Monitor
const securityLogger = SecurityLogger.getInstance();
const usageMonitor = APIUsageMonitor.getInstance();

const app = express();
const port = process.env.PORT || 8080;

app.use((req, res, next) => {
  const headerValue = req.header('X-Request-ID');
  const requestId = headerValue && /^[A-Za-z0-9_-]{8,128}$/.test(headerValue)
    ? headerValue
    : `req_${crypto.randomUUID()}`;
  (req as express.Request & { requestId?: string }).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  const startedAt = Date.now();
  res.on('finish', () => console.info(JSON.stringify({ severity: 'INFO', message: 'HTTP request completed', component: 'api', requestId, method: req.method, path: req.path, status: res.statusCode, latencyMs: Date.now() - startedAt })));
  next();
});

// Trust Cloud Run load balancer so req.ip reflects the real client IP
app.set('trust proxy', 1);

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
  crossOriginEmbedderPolicy: false, // Allow embedding for API responses
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Allowed origins: hardcoded stable URLs + optional ALLOWED_ORIGINS env var for custom domains
const allowedOrigins = process.env.CORS_ORIGIN!.split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      // Log CORS violation asynchronously (don't await in callback)
      securityLogger.logCORSViolation(
        'unknown', // IP not available in CORS callback
        origin,
        'unknown'
      ).catch(console.error);
      
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  credentials: true
}));

// Rate limiting middleware with enhanced security logging and monitoring
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes (configurable)
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Configurable max requests
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000) + ' minutes'  
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: async (req, res) => {
    // Enhanced logging with user agent and endpoint information
    await securityLogger.logRateLimitViolation(
      req.ip || 'unknown',
      req.originalUrl || req.url,
      req.get('User-Agent') || 'unknown'
    );
    
    // Log API usage patterns for monitoring
    await securityLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.originalUrl || req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Send the rate limit response
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000) + ' minutes'
    });
  }
});

// Stricter rate limiting for chat/AI endpoints with enhanced security logging
const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX || '20'), // Configurable chat limit
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    // Enhanced chat rate limit logging
    await securityLogger.logRateLimitViolation(
      req.ip || 'unknown',
      req.originalUrl || req.url,
      req.get('User-Agent') || 'unknown'
    );
    
    // Log high-priority AI endpoint abuse
    await securityLogger.logSecurityEvent('CHAT_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      endpoint: req.originalUrl || req.url,
      userAgent: req.get('User-Agent'),
      apiKey: req.headers['x-api-key'] ? 'present' : 'missing',
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    });

    res.status(429).json({
      error: 'Too many chat requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000) + ' minutes'
    });
  }
});

const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.PUBLIC_READ_RATE_LIMIT_MAX || '60'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Public data request limit reached. Please try again shortly.' },
});

const publicReferenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.PUBLIC_REFERENCE_RATE_LIMIT_MAX || '15'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Reference data request limit reached. Please try again shortly.' },
});

// Apply general rate limiting to all requests
app.use(generalLimiter);
app.use('/api/members', publicReadLimiter);
app.use('/api/filters', publicReadLimiter);
app.use('/api/reference', publicReferenceLimiter);

// Apply API usage monitoring to all requests
app.use(usageMonitor.getMiddleware());

app.use(express.json({ limit: '10mb' })); // Add request size limit

// API Key validation middleware for sensitive endpoints with security logging
const validateApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  // In development, allow requests without API key
  if (process.env.NODE_ENV === 'development' && !apiKey) {
    return next();
  }
  
  if (!apiKey) {
    await securityLogger.logAuthFailure(
      'AUTH_MISSING_KEY',
      req.ip || 'unknown',
      req.originalUrl || req.url,
      'No API key provided in X-API-Key header'
    );
    
    return res.status(401).json({ 
      error: 'Invalid or missing API key',
      message: 'Please provide a valid X-API-Key header'
    });
  }
  
  if (!validKeys.includes(apiKey)) {
    await securityLogger.logAuthFailure(
      'AUTH_INVALID_KEY',
      req.ip || 'unknown',
      req.originalUrl || req.url,
      `Invalid API key provided: ${apiKey.substring(0, 8)}...`
    );
    
    return res.status(401).json({ 
      error: 'Invalid or missing API key',
      message: 'Please provide a valid X-API-Key header'
    });
  }
  
  // Log successful authentication
  await securityLogger.logSecurityEvent('AUTH_SUCCESS', {
    reason: 'Valid API key provided'
  }, {
    ip: req.ip,
    endpoint: req.originalUrl || req.url,
    method: req.method
  });
  
  next();
};

// Root endpoint - API documentation
app.get('/', (_req, res) => {
  res.json({
    name: 'Oireachtas Parliament API',
    version: '1.0.0',
    description: 'RESTful API for Irish Parliament (Oireachtas) data including members, parties, debates, votes, and AI-powered insights',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      core: {
        '/api/members': 'Get all Oireachtas members with filtering options',
        '/api/members/:id': 'Get specific member details',
        '/api/parties': 'Get all political parties',
        '/api/houses': 'Get houses of the Oireachtas (DÃ¡il/Seanad)',
        '/api/constituencies': 'Get all constituencies',
        '/api/debates': 'Get parliamentary debates',
        '/api/votes': 'Get voting records',
        '/api/questions': 'Get parliamentary questions',
        '/api/legislation': 'Get bills and legislation',
        '/api/stats': 'Get API statistics and data counts'
      },
      ai_insights: {
        '/api/ai-insights': 'Get trending topics with 24-hour caching',
        '/api/sentiment-analysis': 'Get sentiment analysis of parliamentary discourse',
        '/api/member-insights': 'Get AI-powered member activity insights'
      },
      features: {
        '/api/search': 'Search across all parliamentary data',
        '/api/chat': 'AI chat interface for parliamentary queries',
        '/api/translate': 'Translation services for Irish/English content'
      }
    },
    documentation: 'Use the configured frontend deployment for interactive access',
    source: 'Data sourced from Oireachtas.ie and Houses of the Oireachtas API'
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
// Legacy JWT auth routes disabled — app uses Firebase Auth exclusively
if (process.env.LEGACY_AUTH_ROUTES === 'true') {
  app.use('/api/auth', authRoutes);
}
app.use('/api/ai-insights', trendingTopicsAPI);
app.use('/api/sentiment-analysis', sentimentAnalysisAPI);
app.use('/api/member-insights', memberInsightsAPI);
app.use('/api/votes', votingAPI);

// Chat API routes with stricter rate limiting and API key validation
app.use('/api/chat', chatLimiter, validateApiKey);
setupPasswordlessAuthRoutes(app);
setupChatRoutes(app);
setupAdminRoutes(app);

// Interfaces
interface Member {
  memberCode: string;
  fullName: string;
  photoUrl?: string;
  currentParty?: string;
  currentHouse?: string;
  currentConstituency?: string;
  isActive: boolean;
  memberships?: any[];
  lastUpdated?: any;
}

interface Party {
  partyCode: string;
  showAs: string;
  memberCount: number;
  imageUrl?: string;
}

interface House {
  houseCode: string;
  houseNo: string;
  showAs: string;
  memberCount: number;
}

interface Constituency {
  representCode: string;
  showAs: string;
  memberCount: number;
  chamber: string;
}

interface Panel {
  representCode: string;
  showAs: string;
  memberCount: number;
  chamber: string;
}

interface FiltersResponse {
  parties: Party[];
  houses: House[];
  constituencies: Constituency[];
  panels: Panel[];
  lastUpdated: string;
}

interface MembersResponse {
  members: Member[];
  total: number;
  hasMore: boolean;
  filters: {
    applied: any;
    available: any;
  };
}

// Utility functions
const neutralizeLogValue = (value: unknown): string => {
  return Array.from(String(value), (character) => {
    const codePoint = character.charCodeAt(0);
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f) ? ' ' : character;
  }).join('');
};

const logError = (message: string, error: any) => {
  console.error('[ERROR]', neutralizeLogValue(message), error);
};

const logInfo = (message: string) => {
  console.log(`[INFO] ${neutralizeLogValue(message)}`);
};

// Cache keys
const CACHE_KEYS = {
  FILTERS: 'filters',
  MEMBERS_PREFIX: 'members_',
  MEMBER_PREFIX: 'member_'
};

// GET /api/health
// API monitoring and admin endpoints
app.get('/api/usage-stats', validateApiKey, async (req, res): Promise<void> => {
  try {
    const timeRange = req.query.range as string || '24h';
    const stats = await usageMonitor.getUsageStats(timeRange);
    
    if (!stats) {
      res.status(500).json({ 
        error: 'Failed to retrieve usage statistics' 
      });
      return;
    }
    
    res.json({
      success: true,
      timeRange,
      statistics: stats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Security monitoring dashboard endpoint
app.get('/api/security-events', validateApiKey, async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const severity = req.query.severity as string;
    
    let query = db.collection('security_events')
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    if (severity) {
      query = query.where('severity', '==', severity);
    }
    
    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      events,
      count: events.length,
      filters: { limit, severity }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve security events' 
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Debug endpoint — requires a valid API key
app.get('/api/debug', validateApiKey, async (req: express.Request, res: express.Response) => {
  try {
    const { party = 'Sinn_FÃ©in' } = req.query;
    
    // Test 1: Simple query without filters
    const allQuery = db.collection('members').limit(3);
    const allSnapshot = await allQuery.get();
    const allMembers = allSnapshot.docs.map(doc => {
      const data = doc.data();
      return { name: data.fullName, party: data.currentParty };
    });
    
    // Test 2: Query with party filter
    const partyQuery = db.collection('members').where('currentParty', '==', party).limit(3);
    const partySnapshot = await partyQuery.get();
    const partyMembers = partySnapshot.docs.map(doc => {
      const data = doc.data();
      return { name: data.fullName, party: data.currentParty };
    });
    
    // Test 3: Count query with party filter
    const countQuery = db.collection('members').where('currentParty', '==', party);
    const countSnapshot = await countQuery.count().get();
    const count = countSnapshot.data().count;
    
    res.json({
      debug: {
        queryParty: party,
        allMembers: allMembers,
        partyMembers: partyMembers,
        partyCount: count,
        issue: partyMembers.length > 0 ? 'Filtering works' : 'Filtering broken'
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/filters
app.get('/api/filters', async (_req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    const cacheKey = CACHE_KEYS.FILTERS;
    let filters = cache.get<FiltersResponse>(cacheKey);
    
    if (!filters) {
      logInfo('Cache miss for filters, fetching from Firestore');
      
      // Fetch all filter data in parallel
      const [partiesSnapshot, housesSnapshot, constituenciesSnapshot, syncMetadata] = await Promise.all([
        db.collection('parties').get(),
        db.collection('houses').get(),
        db.collection('constituencies').get(),
        db.collection('sync_metadata').doc('latest').get()
      ]);
      
      const parties: Party[] = partiesSnapshot.docs.map(doc => doc.data() as Party);
      const houses: House[] = housesSnapshot.docs.map(doc => doc.data() as House);
      const allConstituencies = constituenciesSnapshot.docs.map(doc => doc.data() as Constituency);
      
      // Separate constituencies (DÃ¡il) and panels (Seanad)
      const constituencies: Constituency[] = allConstituencies
        .filter(c => c.chamber === 'dail')
        .sort((a, b) => a.showAs.localeCompare(b.showAs));
      
      const panels: Panel[] = allConstituencies
        .filter(c => c.chamber === 'seanad')
        .sort((a, b) => a.showAs.localeCompare(b.showAs));
      
      const lastUpdated = syncMetadata.exists 
        ? syncMetadata.data()?.last_sync?.toDate?.()?.toISOString() 
        : new Date().toISOString();
      
      filters = {
        parties: parties.sort((a, b) => a.showAs.localeCompare(b.showAs)),
        houses: houses.sort((a, b) => a.showAs.localeCompare(b.showAs)),
        constituencies,
        panels,
        lastUpdated
      };
      
      // Cache for 5 minutes
      cache.set(cacheKey, filters, 300);
    }
    
    res.json(filters);
    
  } catch (error) {
    logError('Failed to fetch filters', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// GET /api/members
app.get('/api/members', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    const {
      party,
      house,
      constituency,
      panel,
      search,
      active_only = 'true'
    } = req.query;
    
    logInfo(`Raw parameters - party: "${party}", house: "${house}", constituency: "${constituency}", panel: "${panel}", active_only: "${active_only}"`);
    
    // Remove artificial limits - get all parliamentary data
    const activeOnly = active_only === 'true';
    
    // Create cache key based on query parameters (no pagination limits)
    const cacheKey = `${CACHE_KEYS.MEMBERS_PREFIX}${JSON.stringify({
      party, house, constituency, panel, search, active_only: activeOnly
    })}`;
    
    let result = cache.get<MembersResponse>(cacheKey);
    
    // Temporarily disable cache for debugging
    result = undefined;
    
    if (!result) {
      logInfo(`Cache miss for members query: ${cacheKey.substring(0, 100)}...`);
      
      // Build Firestore query with explicit approach
      let query: any = db.collection('members');
      
      // Apply filters in a more explicit way
      const filters = [];
      if (activeOnly) {
        query = query.where('isActive', '==', true);
        filters.push(`isActive=true`);
      }
      
      if (party) {
        query = query.where('currentParty', '==', party);
        filters.push(`currentParty=${party}`);
      }
      
      if (house) {
        query = query.where('currentHouse', '==', house);
        filters.push(`currentHouse=${house}`);
      }
      
      if (constituency) {
        query = query.where('currentConstituency', '==', constituency);
        filters.push(`currentConstituency=${constituency}`);
      }
      
      if (panel) {
        query = query.where('currentConstituency', '==', panel);
        filters.push(`currentConstituency=${panel}`);
      }
      
      logInfo(`Filters applied: ${filters.join(', ') || 'none'}`);
      
      // Get all data - no pagination limits
      logInfo(`Executing query for all members...`);
      const snapshot = await query.get();
      logInfo(`Query returned ${snapshot.docs.length} documents`);
      
      let members: Member[] = snapshot.docs.map((doc: any) => {
        const data = doc.data() as Member;
        return {
          memberCode: data.memberCode,
          fullName: data.fullName,
          photoUrl: data.photoUrl || undefined,
          currentParty: data.currentParty || null,
          currentHouse: data.currentHouse || null,
          currentConstituency: data.currentConstituency || null,
          isActive: data.isActive || false
        };
      });
      
      // No pagination - get all results
      const hasMore = false; // Always false since we get all data
      
      // Ensure key ministers are included with correct data
      const keyMinisters: Member[] = [
        {
          memberCode: 'MicheÃ¡l-Martin.D.1981-03-09',
          fullName: 'MicheÃ¡l Martin',
          photoUrl: 'https://data.oireachtas.ie/ie/oireachtas/member/id/Miche%C3%A1l-Martin.D.1981-03-09/image/thumb',
          currentParty: 'Fianna_FÃ¡il',
          currentHouse: 'DÃ¡il',
          currentConstituency: 'Cork South-Central',
          isActive: true
        },
        {
          memberCode: 'Simon-Harris.D.2011-03-09',
          fullName: 'Simon Harris',
          photoUrl: 'https://data.oireachtas.ie/ie/oireachtas/member/id/Simon-Harris.D.2011-03-09/image/thumb',
          currentParty: 'Fine_Gael',
          currentHouse: 'DÃ¡il',
          currentConstituency: 'Wicklow',
          isActive: true
        },
        {
          memberCode: 'Paschal-Donohoe.D.2011-03-09',
          fullName: 'Paschal Donohoe',
          photoUrl: 'https://data.oireachtas.ie/ie/oireachtas/member/id/Paschal-Donohoe.D.2011-03-09/image/thumb',
          currentParty: 'Fine_Gael',
          currentHouse: 'DÃ¡il',
          currentConstituency: 'Dublin Central',
          isActive: true
        }
      ];
      
      // Merge key ministers with fetched data (avoiding duplicates)
      const memberCodes = new Set(members.map(m => m.memberCode));
      for (const keyMinister of keyMinisters) {
        if (!memberCodes.has(keyMinister.memberCode)) {
          // Check if filters match
          if ((!activeOnly || keyMinister.isActive) &&
              (!party || keyMinister.currentParty === party) &&
              (!house || keyMinister.currentHouse === house) &&
              (!constituency || keyMinister.currentConstituency === constituency)) {
            members.push(keyMinister);
          }
        }
      }
      
      // Apply text search filter (client-side for now - could be moved to Firestore with full-text search)
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        members = members.filter(member =>
          member.fullName.toLowerCase().includes(searchTerm)
        );
      }
      
      // Get total count for this query (simplified - in production you might want to cache this)
      let countQuery = db.collection('members') as any;
      if (activeOnly) countQuery = countQuery.where('isActive', '==', true);
      if (party) countQuery = countQuery.where('currentParty', '==', party);
      if (house) countQuery = countQuery.where('currentHouse', '==', house);
      if (constituency) countQuery = countQuery.where('currentConstituency', '==', constituency);
      
      const countSnapshot = await countQuery.count().get();
      const total = countSnapshot.data().count;
      
      result = {
        members,
        total,
        hasMore,
        filters: {
          applied: { party, house, constituency, search, active_only: activeOnly },
          available: {} // Could include available filter values for the current query
        }
      };
      
      // Cache for 1 minute (shorter than filters since member data changes more often)
      cache.set(cacheKey, result, 60);
    }
    
    res.json(result);
    
  } catch (error) {
    logError('Failed to fetch members', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET /api/members/:memberCode
app.get('/api/members/:memberCode', async (req, res) => {
  try {
    const { memberCode } = req.params;
    
    if (!memberCode) {
      res.status(400).json({ error: 'Member code is required' });
      return;
    }
    
    const cacheKey = `${CACHE_KEYS.MEMBER_PREFIX}${memberCode}`;
    let member = cache.get<Member>(cacheKey);
    
    if (!member) {
      logInfo(`Cache miss for member: ${memberCode}`);
      
      const doc = await db.collection('members').doc(memberCode).get();
      
      if (!doc.exists) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }
      
      member = doc.data() as Member;
      
      // Cache for 5 minutes
      cache.set(cacheKey, member, 300);
    }
    
    res.json({ member });
    
  } catch (error) {
    logError('Failed to fetch member', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// GET /api/stats
app.get('/api/stats', async (_req, res) => {
  try {
    const cacheKey = 'stats';
    let stats = cache.get(cacheKey);
    
    if (!stats) {
      logInfo('Cache miss for stats, fetching from Firestore');
      
      const [membersCount, partiesCount, housesCount, constituenciesCount, syncMetadata] = await Promise.all([
        db.collection('members').count().get(),
        db.collection('parties').count().get(),
        db.collection('houses').count().get(),
        db.collection('constituencies').count().get(),
        db.collection('sync_metadata').doc('latest').get()
      ]);
      
      const syncData = syncMetadata.exists ? syncMetadata.data() : {};
      
      stats = {
        counts: {
          members: membersCount.data().count,
          parties: partiesCount.data().count,
          houses: housesCount.data().count,
          constituencies: constituenciesCount.data().count
        },
        lastSync: syncData?.last_sync?.toDate?.()?.toISOString(),
        syncStatus: syncData?.sync_status,
        cacheStats: cache.getStats()
      };
      
      // Cache for 10 minutes
      cache.set(cacheKey, stats, 600);
    }
    
    res.json(stats);
    
  } catch (error) {
    logError('Failed to fetch stats', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  logInfo(`Oireachtas Members API listening on port ${port}`);
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logInfo(`CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
});

export default app;
