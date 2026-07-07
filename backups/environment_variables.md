
# Environment Variables Reference (v1.0 Stable)

## Required (must be set for production)
| Variable | Source | Current Value | Where to Find |
|----------|--------|---------------|---------------|
| VITE_SUPABASE_URL | .env.local | https://jnazlfhhzxrocvxvmkkc.supabase.co | Supabase Dashboard ? Project Settings ? API |
| VITE_SUPABASE_ANON_KEY | .env.local | [REDACTED - in .env.local] | Supabase Dashboard ? Project Settings ? API |

## Optional
| Variable | Source | Current Status | Where to Find |
|----------|--------|----------------|---------------|
| VITE_SENTRY_DSN | .env.local | Empty (not configured) | Sentry Dashboard ? Project ? Client Keys (DSN) |

## Edge Function Secrets (must be set in Supabase Dashboard)
| Secret | Used By | Where to Find |
|--------|---------|---------------|
| GEMINI_API_KEY | gemini function | Google AI Studio ? API Keys |
| RESEND_API_KEY | resend function, scheduled function | Resend Dashboard ? API Keys |
| CRON_SECRET | scheduled function | User-defined (generate random string) |
| SUPABASE_URL | scheduled, middleware functions | Same as VITE_SUPABASE_URL |
| SUPABASE_SERVICE_ROLE_KEY | scheduled, middleware functions | Supabase Dashboard ? Project Settings ? API (service_role key) |

## CI/CD Variables
| Variable | Used By | Where to Set |
|----------|---------|--------------|
| BASE_URL | Playwright tests | GitHub Actions secrets |
