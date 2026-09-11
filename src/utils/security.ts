/**
 * Security utilities for input validation and sanitization
 * With integrated security event logging
 */

import { SecurityEventType } from '../types/security.js';
import { API_URL } from '@/config/runtime';

// Simple security event logger for frontend
class FrontendSecurityLogger {
  private static instance: FrontendSecurityLogger;
  private apiEndpoint: string;
  
  private constructor() {
    this.apiEndpoint = import.meta.env.VITE_API_URL || API_URL;
  }
  
  public static getInstance(): FrontendSecurityLogger {
    if (!FrontendSecurityLogger.instance) {
      FrontendSecurityLogger.instance = new FrontendSecurityLogger();
    }
    return FrontendSecurityLogger.instance;
  }
  
  public async logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, any>,
    endpoint: string = window.location.pathname
  ): Promise<void> {
    try {
      // Log to console for development
      console.warn('[SECURITY-EVENT]', eventType, {
        endpoint,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details
      });
      
      // In production, you could send to your API
      if (import.meta.env.PROD) {
        await fetch(`${this.apiEndpoint}/api/security/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType,
            details: {
              ...details,
              userAgent: navigator.userAgent,
              referrer: document.referrer,
              origin: window.location.origin
            },
            endpoint,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error); // Don't let logging errors break the app
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

const securityLogger = FrontendSecurityLogger.getInstance();

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * @param input - The user input to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove HTML tags except basic formatting
    .replace(/<(?!\/?(b|i|em|strong|br|p)\b)[^>]*>/gi, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validates if input is safe for API queries with security logging
 * @param input - The input to validate
 * @returns True if input is valid and safe
 */
export function validateQueryInput(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(input);
  
  // Check minimum length
  if (sanitized.length < 3) {
    return false;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    { pattern: /\bselect\b.*\bfrom\b/i, type: 'SQL_INJECTION_BLOCKED' },
    { pattern: /\bunion\b.*\bselect\b/i, type: 'SQL_INJECTION_BLOCKED' },
    { pattern: /\bdrop\b.*\btable\b/i, type: 'SQL_INJECTION_BLOCKED' },
    { pattern: /\binsert\b.*\binto\b/i, type: 'SQL_INJECTION_BLOCKED' },
    { pattern: /\bdelete\b.*\bfrom\b/i, type: 'SQL_INJECTION_BLOCKED' },
    { pattern: /\bexec\b|\beval\b/i, type: 'COMMAND_INJECTION_BLOCKED' },
    { pattern: /<script\b/i, type: 'XSS_ATTEMPT_BLOCKED' },
    { pattern: /<iframe\b/i, type: 'XSS_ATTEMPT_BLOCKED' },
    { pattern: /<object\b/i, type: 'XSS_ATTEMPT_BLOCKED' },
    { pattern: /<embed\b/i, type: 'XSS_ATTEMPT_BLOCKED' },
    { pattern: /javascript:/i, type: 'SCRIPT_INJECTION_BLOCKED' },
    { pattern: /\bvbscript:/i, type: 'SCRIPT_INJECTION_BLOCKED' },
    { pattern: /\.\.\//i, type: 'PATH_TRAVERSAL_BLOCKED' },
    { pattern: /on\w+\s*=/i, type: 'XSS_ATTEMPT_BLOCKED' }
  ];

  // Check each pattern and log security events
  for (const { pattern, type } of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      // Log the security event asynchronously
      securityLogger.logSecurityEvent(type as SecurityEventType, {
        originalInput: input.substring(0, 100), // Limit logged content
        sanitizedInput: sanitized.substring(0, 100),
        attackVector: type,
        blocked: true
      }).catch(console.error);
      
      return false; // Block the input
    }
  }

  return true; // Input is safe
}

/**
 * Validates email addresses
 * @param email - Email to validate
 * @returns True if email format is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes URL to prevent open redirect vulnerabilities
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Only allow http/https protocols
  if (!url.match(/^https?:\/\//i)) {
    return '';
  }

  // Block potentially dangerous domains
  const blockedDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1'
  ];

  try {
    const urlObj = new URL(url);
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Rate limiting helper - tracks request counts per IP/user
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  /**
   * Check if request is allowed for given identifier
   * @param identifier - IP address or user ID
   * @returns True if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize counter
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (userRequests.count >= this.maxRequests) {
      return false;
    }

    userRequests.count++;
    return true;
  }

  /**
   * Get remaining requests for identifier
   * @param identifier - IP address or user ID
   * @returns Number of remaining requests
   */
  getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier);
    if (!userRequests || Date.now() > userRequests.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - userRequests.count);
  }
}

/**
 * Escape HTML characters to prevent XSS
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (s) => map[s]);
}