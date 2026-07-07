# Operations Guide

## Monitoring

### Health Checks

Run health checks manually via the application or scheduled cron jobs:

```typescript
import { runHealthCheck } from '../lib/healthCheck';

// Run every 5 minutes
setInterval(async () => {
  const result = await runHealthCheck();
  if (result.status === 'unhealthy') {
    // Alert operations team
    console.error('Health check failed:', result.summary);
  }
}, 5 * 60 * 1000);
```

### Logging

The application uses structured logging with these levels:

| Level | Usage |
|-------|-------|
| DEBUG | Development-only, filtered in production |
| INFO | Normal operational messages |
| WARN | Degraded functionality, non-critical issues |
| ERROR | Operation failures, recoverable errors |
| CRITICAL | Application-breaking errors, startup failures |

Logs are written to browser console in development and preserved in sessionStorage for recent errors.

**Never logged**: Passwords, JWTs, tokens, API keys, or session secrets.

### Sentry Integration

Sentry is initialized on startup when `VITE_SENTRY_DSN` is configured:

```typescript
import { initSentry } from '../lib/sentry';
initSentry();
```

## Database Operations

### Backups

Production database backups are managed by Supabase automatically (daily backups with 7-day retention for the Pro plan).

#### Manual Backup

```bash
# Supabase CLI
supabase db dump --linked > backup_$(date +%Y%m%d).sql

# Direct pg_dump
pg_dump "postgresql://..." > manual_backup.sql
```

### Migration Management

```bash
# Create new migration
supabase migration new migration_name

# Apply to production
supabase db push

# Rollback (if needed)
supabase db pull  # Get current state
# Manually create reverse migration
supabase db push
```

## Edge Functions

### Deployment

```bash
# Deploy single function
supabase functions deploy function_name

# Deploy all functions
for fn in approve-application gemini resend scheduled; do
  supabase functions deploy $fn
done
```

### Secrets Management

```bash
# Set secret
supabase secrets set SECRET_NAME=value

# Remove secret
supabase secrets unset SECRET_NAME

# List secrets
supabase secrets list
```

## Storage

### Bucket Management

Ensure buckets exist with correct policies:

```bash
supabase storage list  # Check existing buckets
supabase storage create bucket-name  # Create if missing
```

## Scheduled Tasks

Configure in Supabase Dashboard > Database > Cron Jobs:

| Task | Schedule | Description |
|------|----------|-------------|
| `session_reminders` | Every hour | Send reminders for upcoming sessions |
| `inactivity_alerts` | Daily at 9 AM | Alert mentors about inactive students (7+ days) |
| `progress_summaries` | Weekly on Monday | Send weekly progress summaries |
| `cleanup` | Daily at 3 AM | Clean up old events, expired tokens, temp files |

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 | Application down or critical feature broken | Immediate |
| P1 | Major feature degraded, no workaround | < 1 hour |
| P2 | Minor feature degraded, workaround exists | < 4 hours |
| P3 | Cosmetic or documentation issues | < 1 week |

### Response Steps

1. **Detect**: Health check alert, Sentry alert, or user report
2. **Assess**: Check health check results, logs, and monitoring
3. **Mitigate**: Apply rollback if necessary (see [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md))
4. **Resolve**: Deploy fix, verify health
5. **Post-mortem**: Document root cause and prevention

## Performance Monitoring

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Database query time | < 200ms avg | > 1000ms |
| Page load time | < 3s | > 5s |
| API response time | < 500ms | > 2000ms |
| Realtime latency | < 500ms | > 2000ms |
| Error rate | < 0.1% | > 1% |

### Optimization

- Database queries should select specific columns (not `SELECT *`)
- Use pagination for list queries (30-50 rows)
- Enable Realtime only on tables that need it
- Images are compressed during upload (max 1200px, 85% quality)
- Signed URLs with 1-hour expiry for storage access
