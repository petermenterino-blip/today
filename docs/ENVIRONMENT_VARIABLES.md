# Environment Variables Reference

## Client-Side Variables (Vite)

These variables are exposed to the browser and must start with `VITE_`.

### Required

| Variable | Environments | Description | Validation |
|----------|-------------|-------------|------------|
| `VITE_SUPABASE_URL` | all | Supabase project URL | Must start with `https://` and contain `supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | all | Supabase anonymous key | Must start with `eyJ` and be >50 chars |

### Environment Configuration

| Variable | Environments | Description | Valid Values |
|----------|-------------|-------------|--------------|
| `VITE_APP_ENV` | all | Environment name | `development`, `staging`, `production` |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_EDGE_APPROVAL` | `false` | Route application approval through secure edge function |
| `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | `false` | Enable state machine with idempotency/retry/rollback |

### Optional Services

| Variable | Description |
|----------|-------------|
| `VITE_SENTRY_DSN` | Sentry error tracking DSN |
| `VITE_POSTHOG_API_KEY` | PostHog analytics API key |
| `VITE_POSTHOG_HOST` | PostHog host URL |

## Server-Side / Edge Function Variables

These are set in Supabase Edge Function secrets (not client-accessible).

### Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | All edge functions | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | All edge functions | Service role key for admin operations |
| `RESEND_API_KEY` | `resend` function | Resend API key for email delivery |

### Optional

| Variable | Used By | Description |
|----------|---------|-------------|
| `CRON_SECRET` | `scheduled` function | Shared secret for authenticating cron requests |
| `GEMINI_API_KEY` | `gemini` function | Google Gemini API key |

## Validation Rules

### Production Fail-Fast

In `production` mode, the application will **block startup** if:

1. `VITE_SUPABASE_URL` is missing, is a placeholder, or doesn't start with `https://`
2. `VITE_SUPABASE_ANON_KEY` is missing or is a placeholder value
3. `VITE_APP_ENV` is missing or not set to `production`

### Production Warnings (non-blocking)

- `VITE_SENTRY_DSN` not set (error monitoring unavailable)
- `VITE_ENABLE_TRANSACTIONAL_PROVISIONING=true` without `VITE_ENABLE_EDGE_APPROVAL=true`

### Sentinel Values

The following values are treated as unconfigured placeholders:

- `your_supabase_project_url`
- `your_supabase_anon_key`
- `placeholder-for-CI`
- `placeholder-key`

## Setup Files

| File | Purpose |
|------|---------|
| `.env` | CI-safe defaults (checked into git) |
| `.env.local` | Local development overrides (gitignored) |
| `.env.example` | Template with placeholder values |
| `.env.production` | Production template |
| `.env.staging` | Staging template |

## Security Notes

- Never commit `.env.local` or real secrets to version control
- Service role keys must never be exposed client-side
- Use Vercel's encrypted environment variables for production
- Rotate Supabase anonymous keys periodically
- Edge function secrets are managed via Supabase Dashboard
