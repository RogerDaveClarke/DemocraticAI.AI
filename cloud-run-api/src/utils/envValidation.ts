import fs from 'fs';
import path from 'path';

/**
 * Backend Environment Variable Validation
 * Validates required environment variables at server startup
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvConfig {
  required: string[];
  optional: string[];
  production: string[];
}

export function loadEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env.local'),
    path.resolve(process.cwd(), '../.env')
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      if (typeof process.loadEnvFile === 'function') {
        try {
          process.loadEnvFile(envPath);
        } catch {
          // ignore non-fatal env load errors
        }
      }
    }
  }
}

const ENV_CONFIG: EnvConfig = {
  // Required in all environments
  required: [
    'NODE_ENV',
    'PORT',
    'GOOGLE_CLOUD_PROJECT',
    'FIREBASE_WEB_API_KEY',
    'PASSWORDLESS_CONTINUE_URL',
    'CORS_ORIGIN'
  ],
  
  // Optional but recommended
  optional: [
    'VALID_API_KEYS',
    'RATE_LIMIT_ENABLED',
    'SECURITY_LOGGING_ENABLED'
  ],
  
  // Required only in production
  production: [
    'VALID_API_KEYS'
  ]
};

export function validateEnvironment(): ValidationResult {
  loadEnvFiles();

  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const isProduction = process.env.NODE_ENV === 'production';

  // Check required variables
  ENV_CONFIG.required.forEach(varName => {
    if (!process.env[varName]) {
      result.errors.push(`Missing required environment variable: ${varName}`);
      result.isValid = false;
    }
  });

  // Check production-specific variables
  if (isProduction) {
    ENV_CONFIG.production.forEach(varName => {
      if (!process.env[varName]) {
        result.errors.push(`Missing required production environment variable: ${varName}`);
        result.isValid = false;
      }
    });
  }

  // Check optional variables (warnings only)
  ENV_CONFIG.optional.forEach(varName => {
    if (!process.env[varName]) {
      result.warnings.push(`Optional environment variable not set: ${varName}`);
    }
  });

  if (process.env.RESEND_API_KEY) {
    ['EMAIL_FROM', 'ADMIN_NOTIFICATION_EMAIL', 'SUPPORT_EMAIL'].forEach(varName => {
      if (!process.env[varName]) {
        result.errors.push(varName + ' is required when RESEND_API_KEY is configured');
        result.isValid = false;
      }
    });
  }
  // Validate PORT
  if (process.env.PORT && !isValidPort(process.env.PORT)) {
    result.errors.push('PORT must be a valid number between 1 and 65535');
    result.isValid = false;
  }

  // Validate API keys format (if present)
  if (process.env.VALID_API_KEYS) {
    const keys = process.env.VALID_API_KEYS.split(',');
    keys.forEach(key => {
      if (!isValidApiKey(key.trim())) {
        result.warnings.push(`API key format may be invalid: ${key.substring(0, 8)}...`);
      }
    });
  }

  // Validate CORS origins (if present)
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    const origins = process.env.CORS_ORIGIN.split(',');
    origins.forEach(origin => {
      if (!isValidUrl(origin.trim())) {
        result.errors.push(`Invalid CORS origin URL: ${origin}`);
        result.isValid = false;
      }
    });
  }

  // Security validation for production
  if (isProduction) {
    if (process.env.CORS_ORIGIN === '*') {
      result.warnings.push('CORS_ORIGIN is set to \'*\' in production - consider restricting to specific domains');
    }
    
    if (!process.env.VALID_API_KEYS || process.env.VALID_API_KEYS.includes('dev-')) {
      result.errors.push('Production environment should not use development API keys');
      result.isValid = false;
    }
  }

  return result;
}

function isValidPort(port: string): boolean {
  const num = parseInt(port, 10);
  return !isNaN(num) && num > 0 && num <= 65535;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || (process.env.NODE_ENV === 'development' && parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

function isValidApiKey(key: string): boolean {
  // Basic validation: API key should be 20+ characters and contain alphanumeric/hyphens
  return key.length >= 20 && /^[a-zA-Z0-9-_]+$/.test(key);
}

export function logValidationResults(result: ValidationResult): void {
  if (!result.isValid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  • ${error}`));
    
    console.error('Shutting down due to environment validation failure');
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

export default {
  validateEnvironment,
  logValidationResults
};