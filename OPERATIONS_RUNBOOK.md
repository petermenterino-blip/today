# Operations Runbook

**App:** Mentorino  
**Last Updated:** 2026-07-06

---

## 1. System Overview

| Component | Provider | SLA | Monitoring |
|-----------|----------|-----|------------|
| Frontend SPA | Vercel | 99.99% | Vercel Dashboard, Sentry |
| Database (PostgreSQL) | Supabase | 99.95% (Pro) | Supabase Dashboard |
| Authentication | Supabase Auth | 99.95% | Health check |
| File Storage | Supabase Storage | 99.95% | Health check |
| Edge Functions | Supabase (Deno) | 99.9% | Health check |
| Email | Resend | 99.9% | Health check |
| Realtime | Supabase Realtime | 99.9% | Health check |
| Monitoring | Sentry | 99.9% | Sentry Dashboard |

---

## 2. Incident Severity Levels

| Level | Definition | Response Time | Notification |
|-------|-----------|---------------|-------------|
| **P0** | Application down / auth broken / data loss | Immediate | Phone / SMS / Slack |
| **P1** | Major feature broken, no workaround | < 1 hour | Slack |
| **P2** | Minor feature degraded, workaround exists | < 4 hours | Slack (next business day) |
| **P3** | Cosmetic / documentation / non-functional | < 1 week | GitHub issue |

### P0 Criteria

- Health check returns `unhealthy`
- 100% of users cannot log in
- Data corruption or loss detected
- Auth service returns errors for all requests
- Sensitive data exposure confirmed

---

## 3. Incident Response Procedure

### 3.1 Detect
- Automated: health check fails, Sentry alert, uptime monitor alert
- Manual: user report, team member observation

### 3.2 Triage
```bash
# 1. Check health check result (run in browser console or脚本)
npx tsx -e "
  import { runHealthCheck } from './src/lib/healthCheck';
  runHealthCheck().then(r => console.log(JSON.stringify(r, null, 2)));
"

# 2. Check Sentry for recent errors
#    Sentry Dashboard > Project > Issues > Last 15 minutes

# 3. Check Supabase status
curl -s https://status.supabase.com | grep -i "incident\|degraded"

# 4. Check Vercel deployment status
vercel list --prod
```

### 3.3 Respond

| Scenario | Action | Reference |
|----------|--------|-----------|
| Frontend broken | Rollback Vercel deployment | ROLLBACK_GUIDE.md §2 |
| Feature bug | Toggle feature flag off | ROLLBACK_GUIDE.md §3 |
| Database corrupted | PIT restore or backup restore | ROLLBACK_GUIDE.md §4 |
| Edge function broken | Redeploy previous version | ROLLBACK_GUIDE.md §5 |
| Multiple failures | Full application rollback | ROLLBACK_GUIDE.md §6 |

### 3.4 Resolve
1. Apply fix or rollback
2. Verify health check passes
3. Verify core flows work
4. Confirm with reporter

### 3.5 Post-Mortem (within 48 hours of P0/P1)
1. Timeline of events
2. Root cause analysis
3. What went well / what didn't
4. Action items to prevent recurrence
5. Update runbook if gaps found

---

## 4. Routine Operations

### 4.1 Daily

```bash
# 1. Check CI pipeline status
gh run list --limit 5 --branch master

# 2. Review Sentry issues (last 24h)
#    Sentry Dashboard > Issues > Filter: last 24h, level: error+

# 3. Check Supabase metrics
#    Supabase Dashboard > Home > Database size, Auth users, Storage usage

# 4. Verify backup job succeeded
gh run list --workflow database-backup.yml --limit 1
```

### 4.2 Weekly

```bash
# 1. Verify storage backup
gh run list --workflow storage-backup.yml --limit 1

# 2. Check database backup integrity
#    Download latest backup, run:
pg_restore --list mentorino-latest.dump | head -30

# 3. Review error trends (Sentry)
#    Sentry Dashboard > Issues > 7-day trend

# 4. Check Supabase free tier usage
#    Supabase Dashboard > Settings > Usage

# 5. Review Vercel analytics
#    Vercel Dashboard > Analytics > Traffic, performance
```

### 4.3 Monthly

```bash
# 1. Perform offline backup
#    See BACKUP_RECOVERY.md §4

# 2. Full restore test
#    Provision temp Supabase project, restore latest backup, verify

# 3. Dependency audit
npm audit --audit-level=high

# 4. Review and rotate secrets if needed
#    See ENVIRONMENT_VARIABLES.md §6

# 5. Capacity review
#    Database size, storage usage, edge function invocations
```

### 4.4 Quarterly

```bash
# 1. Provider migration test
#    Restore to alternate PostgreSQL, verify

# 2. Secrets restore test
gpg --decrypt secrets.gpg > /dev/null && echo "Decryption OK"

# 3. Full DR drill
#    Simulate catastrophic failure, measure RTO/RPO

# 4. Security re-assessment
#    Review RLS policies, edge function auth, API key exposure

# 5. Documentation review
#    Update runbook, rollback guide, env vars doc
```

---

## 5. Monitoring & Alerts

### 5.1 Health Check Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Database unhealthy | 1 check failure | P0 — check Supabase status immediately |
| Auth unhealthy | 1 check failure | P0 — check Supabase Auth |
| Any component unhealthy | 3+ consecutive | Investigate within 1 hour |
| Any latency > 5s | 1 occurrence | Triage — may indicate throttling |

### 5.2 Sentry Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Error rate > 1% / 5 min | Spike | Check for deployment regression |
| Error rate > 5% / 5 min | Spike | P1 — investigate immediately |
| New issue (ERROR level) | First occurrence | Triage within 1 day |
| Critical error in auth flow | Any occurrence | P1 — check auth immediately |

### 5.3 Infrastructure Alerts

| Alert | Source | Action |
|-------|--------|--------|
| Deployment failure | Vercel / GitHub | Check build logs |
| Database size > 1.5 GB | Supabase | Plan upgrade or prune data |
| Storage > 500 MB | Supabase | Prune old files |
| Edge function timeout | Supabase | Review function performance |
| SSL certificate expiry | Vercel | Auto-renewed, verify if alert |

---

## 6. Database Management

### 6.1 Connection String

```
postgresql://postgres.<ref>:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 6.2 Common Queries

```sql
-- Active users in last 7 days
SELECT COUNT(DISTINCT user_id) FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days';

-- Database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Realtime connections
SELECT COUNT(*) FROM realtime_subscriptions;

-- Pending applications
SELECT COUNT(*) FROM applications WHERE status = 'pending_review';

-- Failed provisioning
SELECT * FROM provisioning_jobs WHERE status = 'failed' ORDER BY updated_at DESC;
```

### 6.3 Migration Procedure

```bash
# Create migration
supabase migration new <description>

# Test locally
supabase db start
supabase db reset

# Push to production
supabase db push

# Verify
supabase db run --file scripts/verify_migration.sql
```

---

## 7. Edge Functions

### 7.1 Functions Inventory

| Function | Language | Dependencies | Timeout |
|----------|----------|-------------|---------|
| `approve-application` | Deno | Supabase, Resend SDK | 60s |
| `gemini` | Deno | Google AI SDK | 30s |
| `resend` | Deno | Resend SDK | 30s |
| `scheduled` | Deno | Supabase | 120s |

### 7.2 Logs

```bash
# View function logs
supabase functions logs <name> --limit 50

# Tail live
supabase functions logs <name> --tail
```

### 7.3 Secrets

```bash
# List all
supabase secrets list

# Set individual
supabase secrets set KEY=value

# Bulk set from file
cat secrets.env | while IFS='=' read -r key value; do
  supabase secrets set "$key=$value"
done
```

---

## 8. Escalation Contacts

| Service | Support Channel | Expected Response |
|---------|----------------|-------------------|
| Supabase | Dashboard > Help > Support | 4 hours (Pro) |
| Vercel | vercel.com/help | 4 hours (Pro) |
| Resend | resend.com/support | 4 hours |
| Sentry | sentry.io/support | 8 hours |
| Google Gemini | cloud.google.com/support | 8 hours |

---

## 9. Maintenance Windows

| Activity | Frequency | Downtime | Window |
|----------|-----------|----------|--------|
| Database migration | As needed | None (no schema locks) | Any time |
| Edge function deploy | As needed | None (hot-swap) | Any time |
| Frontend deploy | As needed | None (Vercel zero-downtime) | Any time |
| Full DR test | Quarterly | Planned 30 min | Sunday 04:00-05:00 UTC |
| Dependency update | Monthly | None | Off-peak |
| Secret rotation | Quarterly | None (hot-update) | Off-peak |

---

## 10. Key Metrics & Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Page load (P75) | < 2s | 2-4s | > 4s |
| Auth response (P95) | < 500ms | 500ms-2s | > 2s |
| Query time (P95) | < 200ms | 200ms-1s | > 1s |
| Error rate | < 0.1% | 0.1-1% | > 1% |
| Realtime latency | < 200ms | 200ms-1s | > 1s |
| Edge function (P95) | < 2s | 2-5s | > 5s |
| Free tier storage | < 50% | 50-80% | > 80% |
| Daily active users | — | Trend down | Sudden drop > 50% |

---

## 11. Useful Commands Cheat Sheet

```bash
# Health check
npx tsx -e "import('./src/lib/healthCheck').then(m => m.runHealthCheck().then(r => console.log(JSON.stringify(r,null,2))))"

# Deploy all edge functions
for fn in approve-application gemini resend scheduled; do
  supabase functions deploy "$fn"
done

# Database backup
pg_dump --format=custom --file=backup.dump "$PRODUCTION_DATABASE_URL"

# Restore database
pg_restore --clean --if-exists --dbname=postgres backup.dump

# List Vercel deployments
vercel list --prod

# Vercel rollback
vercel rollback

# List Supabase migrations
supabase migration list

# View Supabase function logs
supabase functions logs approve-application --tail

# Export env from Vercel
vercel env list

# Set Supabase secrets
supabase secrets set KEY=value

# Check git tags
git tag -l 'pre-deploy-*' | sort
```
