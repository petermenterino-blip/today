# Production Setup Guide

## Prerequisites

- Node.js 20+
- npm 9+
- Supabase CLI (for DB management)
- Vercel CLI (for deployment)
- GitHub account with CI enabled

## 1. Environment Configuration

### Required Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Settings > API |
| `VITE_APP_ENV` | Set to `production` | — |
| `VITE_ENABLE_EDGE_APPROVAL` | Enable edge function approval | `true` |

### Edge Function Environment Variables

Set these in Supabase Dashboard > Edge Functions:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret) |
| `RESEND_API_KEY` | Resend API key for email |
| `CRON_SECRET` | Shared secret for cron job auth |
| `GEMINI_API_KEY` | Google Gemini API key |

### Vercel Environment Variables

Set in Vercel Dashboard > Project > Settings > Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV` = `production`
- `VITE_ENABLE_EDGE_APPROVAL` = `true`
- `VITE_SENTRY_DSN` (optional)

## 2. Supabase Setup

```bash
# Link local project to production
supabase link --project-ref jnazlfhhzxrocvxvmkkc

# Push all migrations to production
supabase db push

# Deploy edge functions
supabase functions deploy approve-application
supabase functions deploy gemini
supabase functions deploy resend
supabase functions deploy scheduled
```

### Storage Buckets

Ensure these buckets exist:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `profile-avatars` | Yes | User avatars |
| `student-documents` | No | Student private docs |
| `mentor-resources` | No | Mentor resources |
| `gallery-images` | Yes | Event gallery images |

### Realtime

Enable Realtime on these tables in Supabase Dashboard:

- `messages`
- `notifications`
- `sessions`
- `bookings`

## 3. Vercel Deployment

```bash
# Build
npm run build

# Deploy
vercel --prod

# Or via Vercel Dashboard:
# 1. Connect GitHub repository
# 2. Configure build command: npm run build
# 3. Configure output directory: dist
# 4. Set environment variables
# 5. Deploy
```

## 4. Post-Deployment Verification

1. Visit the production URL
2. Confirm health endpoint responds
3. Test authentication flow
4. Verify database connectivity
5. Test edge functions
6. Confirm email delivery
7. Verify Realtime subscriptions

## 5. Monitoring

- **Sentry**: Error tracking (configure `VITE_SENTRY_DSN`)
- **Supabase Dashboard**: Database, Auth, Storage monitoring
- **Vercel Dashboard**: Deployment logs, analytics, function metrics

## 6. Scheduled Tasks

Configure Supabase Cron Jobs:

| Schedule | Function | Purpose |
|----------|----------|---------|
| Every hour | `scheduled` with `session_reminders` | Send session reminders |
| Daily | `scheduled` with `inactivity_alerts` | Alert inactive students |
| Weekly | `scheduled` with `progress_summaries` | Send progress summaries |
| Daily | `scheduled` with `cleanup` | Clean up old data |
