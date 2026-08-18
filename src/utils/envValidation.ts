/**
 * Environment Variable Validation
 * Validates required environment variables at application startup
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

const ENV_CONFIG: EnvConfig = {
  // Required in all environments
  required: [
    'VITE_API_URL'
  ],
  
  // Optional but recommended
  optional: [
    'VITE_API_KEY',
    'VITE_GA_MEASUREMENT_ID'
  ],
  
  // Required only in production
  production: [
    'VITE_API_KEY',
    'VITE_GOOGLE_CLIENT_ID'
  ]
};

export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const isProduction = import.meta.env.PROD;
  const envVars = import.meta.env;

  // Check required variables
  ENV_CONFIG.required.forEach(varName => {
    if (!envVars[varName]) {
      result.errors.push(`Missing required environment variable: ${varName}`);
      result.isValid = false;
    }
  });

  // Check production-specific variables
  if (isProduction) {
    ENV_CONFIG.production.forEach(varName => {
      if (!envVars[varName]) {
        result.errors.push(`Missing required production environment variable: ${varName}`);
        result.isValid = false;
      }
    });
  }

  // Check optional variables (warnings only)
  ENV_CONFIG.optional.forEach(varName => {
    if (!envVars[varName]) {
      result.warnings.push(`Optional environment variable not set: ${varName}`);
    }
  });

  // Validate API URL format
  if (envVars.VITE_API_URL && !isValidUrl(envVars.VITE_API_URL)) {
    result.errors.push('VITE_API_URL must be a valid HTTPS URL');
    result.isValid = false;
  }

  // Validate API key format (if present)
  if (envVars.VITE_API_KEY && !isValidApiKey(envVars.VITE_API_KEY)) {
    result.warnings.push('VITE_API_KEY format may be invalid (should be 30+ characters)');
  }

  return result;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || (import.meta.env.DEV && parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

function isValidApiKey(key: string): boolean {
  // Basic validation: API key should be 30+ characters and contain alphanumeric/hyphens
  return key.length >= 30 && /^[a-zA-Z0-9-_]+$/.test(key);
}

export function logValidationResults(result: ValidationResult): void {
  if (!result.isValid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  • ${error}`));
    
    if (import.meta.env.PROD) {
      throw new Error('Environment validation failed. Check console for details.');
    }
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

// Auto-validate on import in development
if (import.meta.env.DEV) {
  const result = validateEnvironment();
  logValidationResults(result);
}