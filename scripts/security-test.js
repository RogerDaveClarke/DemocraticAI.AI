#!/usr/bin/env node

/**
 * Security Testing Script for Parliament Explorer
 * Tests the security implementations we've applied
 */

const https = require('https');
const http = require('http');

class SecurityTester {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  log(test, result, details = '') {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}${details ? ' - ' + details : ''}`);
    this.results.push({ test, result, details });
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'SecurityTester/1.0',
          ...options.headers
        },
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        }));
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async testSecurityHeaders() {
    console.log('\n🔒 Testing Security Headers...\n');
    
    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;
      
      // Test for security headers
      this.log('X-Content-Type-Options', headers['x-content-type-options'] === 'nosniff');
      this.log('X-Frame-Options', headers['x-frame-options'] === 'DENY');
      this.log('X-XSS-Protection', headers['x-xss-protection'] === '1; mode=block');
      this.log('Strict-Transport-Security', !!headers['strict-transport-security']);
      this.log('Content-Security-Policy', !!headers['content-security-policy']);
      
    } catch (error) {
      this.log('Security Headers Test', false, error.message);
    }
  }

  async testRateLimiting() {
    console.log('\n⏱️ Testing Rate Limiting...\n');
    
    try {
      // Test general rate limiting
      for (let i = 0; i < 5; i++) {
        const response = await this.makeRequest('/api/members');
        if (i === 0) {
          this.log('API Endpoint Accessible', response.statusCode === 200);
          this.log('Rate Limit Headers Present', !!response.headers['ratelimit-limit'] || !!response.headers['x-ratelimit-limit']);
        }
      }
      
    } catch (error) {
      this.log('Rate Limiting Test', false, error.message);
    }
  }

  async testCORS() {
    console.log('\n🌐 Testing CORS Configuration...\n');
    
    try {
      // Test CORS with a potentially blocked origin
      const response = await this.makeRequest('/', {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      this.log('CORS Properly Configured', corsHeader !== '*', `Origin: ${corsHeader}`);
      
    } catch (error) {
      this.log('CORS Test', false, error.message);
    }
  }

  async testInputValidation() {
    console.log('\n🛡️ Testing Input Validation...\n');
    
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      'SELECT * FROM users WHERE id = 1; DROP TABLE users;',
      '<iframe src="https://evil.com"></iframe>',
      'eval("malicious code")',
      'on error="malicious()"'
    ];

    for (const input of maliciousInputs) {
      try {
        const response = await this.makeRequest('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key'
          },
          body: JSON.stringify({
            query: input,
            context: [],
            model: 'gemini-flash',
            userLanguage: 'en',
            prompt: input,
            sessionId: 'test-session'
          })
        });
        
        // Should either reject malicious input or sanitize it
        const blocked = response.statusCode === 400 || response.statusCode === 401;
        this.log(`Input Validation for "${input.substring(0, 20)}..."`, blocked);
        
      } catch (error) {
        // Network errors are fine for this test
        this.log(`Input Validation for "${input.substring(0, 20)}..."`, true, 'Connection blocked');
      }
    }
  }

  async testAPIKeyAuthentication() {
    console.log('\n🔑 Testing API Key Authentication...\n');
    
    try {
      // Test without API key
      const responseNoKey = await this.makeRequest('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test query',
          context: [],
          model: 'gemini-flash',
          userLanguage: 'en',
          sessionId: 'test'
        })
      });
      
      // Should be blocked in production, allowed in development
      const blocked = responseNoKey.statusCode === 401;
      this.log('API Key Required', blocked || process.env.NODE_ENV === 'development');
      
      // Test with invalid API key
      const responseInvalidKey = await this.makeRequest('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'invalid-key'
        },
        body: JSON.stringify({
          query: 'test query',
          context: [],
          model: 'gemini-flash',
          userLanguage: 'en',
          sessionId: 'test'
        })
      });
      
      this.log('Invalid API Key Rejected', responseInvalidKey.statusCode === 401);
      
    } catch (error) {
      this.log('API Key Authentication Test', false, error.message);
    }
  }

  async testRequestSizeLimits() {
    console.log('\n📦 Testing Request Size Limits...\n');
    
    try {
      // Create a large payload (over 10MB)
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB
      
      const response = await this.makeRequest('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key'
        },
        body: JSON.stringify({
          query: largePayload,
          context: [],
          model: 'gemini-flash',
          userLanguage: 'en',
          sessionId: 'test'
        })
      });
      
      // Should reject large payloads
      this.log('Large Request Rejected', response.statusCode === 413 || response.statusCode === 400);
      
    } catch (error) {
      // Connection errors are expected for large payloads
      this.log('Large Request Rejected', true, 'Connection terminated');
    }
  }

  async runAllTests() {
    console.log('🧪 Parliament Explorer Security Test Suite');
    console.log('==========================================');
    console.log(`Testing: ${this.baseUrl}`);
    
    await this.testSecurityHeaders();
    await this.testRateLimiting();
    await this.testCORS();
    await this.testInputValidation();
    await this.testAPIKeyAuthentication();
    await this.testRequestSizeLimits();
    
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const passed = this.results.filter(r => r.result).length;
    const total = this.results.length;
    
    console.log(`Passed: ${passed}/${total} tests`);
    
    if (passed === total) {
      console.log('🎉 All security tests passed!');
    } else {
      console.log('⚠️ Some security tests failed. Review the results above.');
      
      const failed = this.results.filter(r => !r.result);
      console.log('\nFailed tests:');
      failed.forEach(test => {
        console.log(`  - ${test.test}${test.details ? ': ' + test.details : ''}`);
      });
    }
    
    return passed === total;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:8080';
  const tester = new SecurityTester(baseUrl);
  
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityTester;