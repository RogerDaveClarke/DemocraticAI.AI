/**
 * API Usage Monitoring Middleware
 * Tracks API access patterns and detects unusual behavior
 */

import express from 'express';
import { Firestore } from '@google-cloud/firestore';

interface APIUsageRecord {
  timestamp: string;
  ip: string;
  endpoint: string;
  method: string;
  userAgent: string;
  responseCode: number;
  responseTime: number;
  dataTransferred: number;
  apiKey?: string | null;
  suspicious: boolean;
  patterns: string[];
}

interface UsagePattern {
  type: 'rapid_requests' | 'large_downloads' | 'unusual_endpoints' | 'bot_behavior';
  confidence: number;
  evidence: string[];
}

class APIUsageMonitor {
  private static instance: APIUsageMonitor;
  private db: Firestore;
  private usageBuffer: APIUsageRecord[] = [];
  
  private constructor() {
    this.db = new Firestore();
    
    // Flush usage buffer every 30 seconds
    setInterval(() => this.flushUsageBuffer(), 30000);
  }
  
  public static getInstance(): APIUsageMonitor {
    if (!APIUsageMonitor.instance) {
      APIUsageMonitor.instance = new APIUsageMonitor();
    }
    return APIUsageMonitor.instance;
  }
  
  /**
   * Middleware to monitor API usage
   */
  public getMiddleware(): express.RequestHandler {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Override res.end to capture response details
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Analyze request patterns
        const patterns = APIUsageMonitor.instance.analyzeRequestPatterns(req, responseTime);
        
        // Record usage
        const record: APIUsageRecord = {
          timestamp: new Date().toISOString(),
          ip: req.ip || 'unknown',
          endpoint: req.originalUrl || req.url,
          method: req.method,
          userAgent: req.get('User-Agent') || 'unknown',
          responseCode: res.statusCode,
          responseTime,
          dataTransferred: chunk ? Buffer.byteLength(chunk) : 0,
          apiKey: req.headers['x-api-key'] ? 'present' : null,
          suspicious: patterns.length > 0,
          patterns: patterns.map(p => p.type)
        };
        
        APIUsageMonitor.instance.recordUsage(record);
        
        // Call original end method and return the result
        return originalEnd(chunk, encoding, cb);
      };
      
      next();
    };
  }
  
  /**
   * Analyze request patterns for suspicious behavior
   */
  private analyzeRequestPatterns(req: express.Request, responseTime: number): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const userAgent = req.get('User-Agent') || '';
    const endpoint = req.originalUrl || req.url;
    
    // Detect bot behavior
    if (this.isBotUserAgent(userAgent)) {
      patterns.push({
        type: 'bot_behavior',
        confidence: 0.8,
        evidence: [`Bot-like user agent: ${userAgent}`]
      });
    }
    
    // Detect unusual endpoints
    if (this.isUnusualEndpoint(endpoint)) {
      patterns.push({
        type: 'unusual_endpoints',
        confidence: 0.6,
        evidence: [`Unusual endpoint access: ${endpoint}`]
      });
    }
    
    // Detect rapid requests (would need session tracking for full implementation)
    if (responseTime < 100) {
      patterns.push({
        type: 'rapid_requests',
        confidence: 0.4,
        evidence: [`Very fast response time: ${responseTime}ms`]
      });
    }
    
    return patterns;
  }
  
  /**
   * Check if user agent looks like a bot
   */
  private isBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'wget', 'curl',
      'python-requests', 'axios', 'fetch', 'node-fetch'
    ];
    
    return botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );
  }
  
  /**
   * Check if endpoint is unusual
   */
  private isUnusualEndpoint(endpoint: string): boolean {
    const unusualPatterns = [
      '/admin', '/.env', '/config', '/backup', '/debug',
      '/wp-admin', '/phpmyadmin', '/.git'
    ];
    
    return unusualPatterns.some(pattern => 
      endpoint.toLowerCase().includes(pattern)
    );
  }
  
  /**
   * Record API usage
   */
  private async recordUsage(record: APIUsageRecord): Promise<void> {
    this.usageBuffer.push(record);
    
    // If buffer is getting large or suspicious activity detected, flush immediately
    if (this.usageBuffer.length > 100 || record.suspicious) {
      await this.flushUsageBuffer();
    }
  }
  
  /**
   * Flush usage buffer to Firestore
   */
  private async flushUsageBuffer(): Promise<void> {
    if (this.usageBuffer.length === 0) return;
    
    try {
      const batch = this.db.batch();
      const records = [...this.usageBuffer];
      this.usageBuffer = [];
      
      for (const record of records) {
        const docRef = this.db.collection('api_usage').doc();
        batch.set(docRef, record);
      }
      
      await batch.commit();
      console.log(`Flushed ${records.length} API usage records`);
      
    } catch (error) {
      console.error('Failed to flush API usage records:', error);
      // Keep records in buffer for retry
      this.usageBuffer.unshift(...this.usageBuffer);
    }
  }
  
  /**
   * Get usage statistics for monitoring dashboard
   */
  public async getUsageStats(timeRange: string = '24h'): Promise<any> {
    try {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      
      const snapshot = await this.db.collection('api_usage')
        .where('timestamp', '>=', since.toISOString())
        .get();
      
      const records = snapshot.docs.map(doc => doc.data() as APIUsageRecord);
      
      return {
        totalRequests: records.length,
        uniqueIPs: new Set(records.map(r => r.ip)).size,
        suspiciousRequests: records.filter(r => r.suspicious).length,
        averageResponseTime: records.reduce((sum, r) => sum + r.responseTime, 0) / records.length,
        topEndpoints: this.getTopEndpoints(records),
        topUserAgents: this.getTopUserAgents(records),
        errorRate: records.filter(r => r.responseCode >= 400).length / records.length * 100
      };
      
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }
  
  private getTopEndpoints(records: APIUsageRecord[]) {
    const endpointCounts = records.reduce((acc, record) => {
      acc[record.endpoint] = (acc[record.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }
  
  private getTopUserAgents(records: APIUsageRecord[]) {
    const userAgentCounts = records.reduce((acc, record) => {
      const ua = record.userAgent.substring(0, 100); // Truncate for readability
      acc[ua] = (acc[ua] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(userAgentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userAgent, count]) => ({ userAgent, count }));
  }
}

export default APIUsageMonitor;