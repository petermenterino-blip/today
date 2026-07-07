import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnvironment, validateEdgeFunctionEnv, getEnvSummary } from '../envValidator';

vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('validateEnvironment', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://testproject.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ');
    vi.stubEnv('VITE_APP_ENV', 'development');
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/project');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns valid in development with valid config', () => {
    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('reports missing required vars in production', () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_SENTRY_DSN', '');

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('VITE_SUPABASE_URL');
    expect(result.missing).toContain('VITE_SUPABASE_ANON_KEY');
  });

  it('rejects sentinel values in production', () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'your_supabase_anon_key');
    vi.stubEnv('VITE_SENTRY_DSN', 'placeholder-key');

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.invalid.length).toBeGreaterThan(0);
  });

  it('validates supabase URL format in production', () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_SUPABASE_URL', 'http://not-https.com');

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
  });

  it('validates anon key format in production', () => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'short-key');

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
  });

  it('adds warning for local Supabase in development', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder-for-CI');

    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns valid for staging with valid config', () => {
    vi.stubEnv('VITE_APP_ENV', 'staging');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://staging.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ');

    const result = validateEnvironment();
    expect(result.valid).toBe(true);
  });
});

describe('validateEdgeFunctionEnv', () => {
  it('returns valid when all required vars are present', () => {
    const denv = {
      get: (key: string) => {
        const map: Record<string, string> = {
          SUPABASE_URL: 'https://project.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
          RESEND_API_KEY: 'resend-key',
        };
        return map[key];
      },
    };
    const result = validateEdgeFunctionEnv(denv);
    expect(result.valid).toBe(true);
  });

  it('reports missing required vars', () => {
    const denv = { get: () => undefined };
    const result = validateEdgeFunctionEnv(denv);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('SUPABASE_URL');
    expect(result.missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(result.missing).toContain('RESEND_API_KEY');
  });

  it('returns valid when denv is null', () => {
    const result = validateEdgeFunctionEnv(undefined);
    expect(result.valid).toBe(true);
  });

  it('adds warning when CRON_SECRET is not set', () => {
    const denv = {
      get: (key: string) => {
        const map: Record<string, string> = {
          SUPABASE_URL: 'https://project.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'key',
          RESEND_API_KEY: 'key',
        };
        return map[key];
      },
    };
    const result = validateEdgeFunctionEnv(denv);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('getEnvSummary', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/project');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns summary with truncated supabase URL', () => {
    const summary = getEnvSummary();
    expect(summary.APP_ENV).toBe('production');
    expect(summary.SUPABASE_URL).toContain('...');
    expect(summary.SENTRY_DSN).toBe('configured');
  });
});
