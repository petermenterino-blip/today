import { logger } from './logger';

export interface EnvVar {
  key: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
}

const PRODUCTION_REQUIRED: EnvVar[] = [
  { key: 'VITE_SUPABASE_URL', required: true, description: 'Supabase project URL', validator: (v) => v.startsWith('https://') && v.includes('supabase.co') },
  { key: 'VITE_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key', validator: (v) => v.startsWith('eyJ') && v.length > 50 },
  { key: 'VITE_APP_ENV', required: true, description: 'Application environment (must be "production")' },
  { key: 'VITE_SENTRY_DSN', required: true, description: 'Sentry DSN for error monitoring' },
];

const STAGING_REQUIRED: EnvVar[] = [
  { key: 'VITE_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key' },
  { key: 'VITE_APP_ENV', required: true, description: 'Application environment' },
];

const DEVELOPMENT_OPTIONAL: EnvVar[] = [
  { key: 'VITE_SUPABASE_URL', required: false, description: 'Supabase project URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', required: false, description: 'Supabase anonymous key' },
];

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

function getApplicableVars(): EnvVar[] {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  switch (env) {
    case 'production': return PRODUCTION_REQUIRED;
    case 'staging': return STAGING_REQUIRED;
    default: return DEVELOPMENT_OPTIONAL;
  }
}

const SENTINEL_VALUES = new Set([
  'your_supabase_project_url',
  'your_supabase_anon_key',
  'placeholder-for-CI',
  'placeholder-key',
]);

export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    invalid: [],
    warnings: [],
  };

  const vars = getApplicableVars();
  const env = import.meta.env.VITE_APP_ENV || 'development';

  for (const v of vars) {
    const value = import.meta.env[v.key];

    if (!value) {
      if (v.required) {
        result.missing.push(v.key);
        result.valid = false;
      }
      continue;
    }

    if (SENTINEL_VALUES.has(value.trim())) {
      if (v.required) {
        result.invalid.push(`${v.key} contains placeholder/sentinel value`);
        result.valid = false;
      } else {
        result.warnings.push(`${v.key} contains placeholder/sentinel value`);
      }
      continue;
    }

    if (v.validator && !v.validator(value)) {
      result.invalid.push(`${v.key} failed format validation: ${v.description}`);
      if (v.required) result.valid = false;
    }
  }

  if (env === 'production') {
    if (import.meta.env.VITE_ENABLE_TRANSACTIONAL_PROVISIONING === 'true' && import.meta.env.VITE_ENABLE_EDGE_APPROVAL !== 'true') {
      result.warnings.push('VITE_ENABLE_TRANSACTIONAL_PROVISIONING=true requires VITE_ENABLE_EDGE_APPROVAL=true');
    }
  }

  if (env === 'development') {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (url.includes('localhost') || key === 'placeholder-for-CI') {
      result.warnings.push('Running with local/CI Supabase configuration — some features may be unavailable');
    }
  }

  return result;
}

export function validateEdgeFunctionEnv(denoEnv?: { get: (key: string) => string | undefined }): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    invalid: [],
    warnings: [],
  };

  if (!denoEnv) return result;

  const requiredEdgeVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'];

  for (const key of requiredEdgeVars) {
    const value = denoEnv.get(key);
    if (!value) {
      result.missing.push(key);
      result.valid = false;
    }
  }

  if (!denoEnv.get('CRON_SECRET')) {
    result.warnings.push('CRON_SECRET not set — scheduled tasks will reject unauthenticated requests');
  }

  return result;
}

export function getEnvSummary(): Record<string, string> {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return {
    APP_ENV: env,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.slice(0, 25)}...` : 'NOT SET',
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN ? 'configured' : 'not set',
    EDGE_APPROVAL: import.meta.env.VITE_ENABLE_EDGE_APPROVAL || 'false',
    TRANSACTIONAL_PROVISIONING: import.meta.env.VITE_ENABLE_TRANSACTIONAL_PROVISIONING || 'false',
    POSTHOG: import.meta.env.VITE_POSTHOG_API_KEY ? 'configured' : 'not set',
    MODE: import.meta.env.MODE || 'unknown',
  };
}
