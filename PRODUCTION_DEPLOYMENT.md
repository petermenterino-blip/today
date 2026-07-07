# Production Deployment Guide

**App:** Mentorino  
**Stack:** React 19 SPA + Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)  
**Hosting:** Vercel (frontend) + Supabase (backend)  
**Last Updated:** 2026-07-06

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20.x | Build & tooling |
| npm | >= 9.x | Dependency management |
| Supabase CLI | latest | DB migrations, edge function deployment |
| Vercel CLI | latest | Frontend deployment |
| `psql` / `pg_dump` | 16.x | Database operations & backup |

Verify locally:
```bash
node --version && npm --version
supabase --version && vercel --version
psql --version && pg_dump --version
```

---

## 2. Deployment Sequence

### Phase A — Database (Supabase)

```bash
# 1. Link to production project
supabase link --project-ref <production-project-ref>

# 2. Push all migrations (45 total)
supabase db push

# 3. Verify RLS policies are active
supabase db run --file scripts/verify_rls.sql

# 4. Enable Realtime on messaging tables
#    - messages, notifications, sessions, bookings
#    (via Supabase Dashboard > Database > Replication)
```

### Phase B — Edge Functions

```bash
# 1. Deploy all 4 functions
for fn in approve-application gemini resend scheduled; do
  supabase functions deploy "$fn"
done

# 2. Set secrets
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"
supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"
supabase secrets set CRON_SECRET="$CRON_SECRET"

# 3. Verify secrets
supabase secrets list

# 4. Test each endpoint
supabase functions serve --no-browser --workdir . &
curl -X POST "http://localhost:54321/functions/v1/gemini" \
  -H "Content-Type: application/json" \
  -d '{"type":"health","prompt":"ping"}'
```

### Phase C — Frontend (Vercel)

```bash
# 1. Install & build
npm ci
npm run build

# 2. Verify build output
ls -la dist/   # Should contain index.html + assets/

# 3. Deploy
vercel --prod

# 4. Confirm alias resolves
vercel alias ls
```

### Phase D — Post-Deploy

```bash
# 1. Run health check
curl -s https://mentorino.app/health | jq .

# 2. Verify SSL
curl -svI https://mentorino.app/ 2>&1 | grep "SSL connection"

# 3. Validate sitemap/indexability
curl -s https://mentorino.app/robots.txt
curl -s https://mentorino.app/sitemap.xml
```

---

## 3. Storage Bucket Verification

Ensure these 4 buckets exist with proper RLS:

| Bucket | Public | Write Policy |
|--------|--------|--------------|
| `profile-avatars` | Yes | Authenticated users (own) |
| `student-documents` | No | Students (own) + mentors (assigned) |
| `mentor-resources` | No | Mentors (own) |
| `gallery-images` | Yes | Mentors only |

```bash
supabase storage list
```

---

## 4. Cron Job Configuration

Configure in Supabase Dashboard > Database > Cron Jobs:

| Job | Schedule | Function Payload |
|-----|----------|------------------|
| Session reminders | `0 * * * *` | `{"type":"session_reminders"}` |
| Inactivity alerts | `0 9 * * *` | `{"type":"inactivity_alerts"}` |
| Progress summaries | `0 8 * * 1` | `{"type":"progress_summaries"}` |
| Cleanup | `0 3 * * *` | `{"type":"cleanup"}` |

Each request must include `Authorization: Bearer <CRON_SECRET>`.

---

## 5. Verification Checklist

- [ ] `supabase db push` completes without errors
- [ ] All 45 migrations applied (check `supabase migration list`)
- [ ] All 4 edge functions return 200 on health ping
- [ ] `npm run build` produces valid `dist/` output
- [ ] Vercel deployment shows status "Ready"
- [ ] Production URL returns 200
- [ ] Sentry receives test event
- [ ] Auth: signup, login, password reset all work
- [ ] Storage: upload/download/delete for each bucket
- [ ] Realtime: messages deliver in < 2s across tabs
- [ ] Email: welcome/notification emails deliver
- [ ] Cron jobs registered and executing

---

## 6. Rollback Preparation (before deploying)

```bash
# Tag current known-good state
git tag pre-deploy-$(date +%Y%m%d)
git push origin pre-deploy-$(date +%Y%m%d)

# Export current database
pg_dump --format=custom --file=pre-deploy-backup.dump \
  "$PRODUCTION_DATABASE_URL"

# Note current Vercel deployment ID
vercel list --prod | head -5
```

---

## 7. Environment Variables to Set in Vercel

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API |
| `VITE_APP_ENV` | `production` |
| `VITE_ENABLE_EDGE_APPROVAL` | `true` |
| `VITE_SENTRY_DSN` | Sentry Dashboard > Project > DSN |

---

## 8. Incident Rollback Triggers

Rollback immediately if after deployment:
- Health check returns `unhealthy` for database or auth
- Error rate in Sentry exceeds 5% of requests
- > 50% of users experience authentication failures
- Data integrity issue detected (missing/corrupted records)

See [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md) for procedure.
