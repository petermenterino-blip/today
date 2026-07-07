# Launch Checklist

**App:** Mentorino — Premium Mentorship Platform  
**Last Updated:** 2026-07-06  
**Status:** ❌ NOT YET LAUNCHED — See Go/No-Go Gates below

---

## Go/No-Go Gates

All 5 gates MUST pass before proceeding to T-2 hours.

### Gate 1 — No Critical Security Issues

| ID | Issue | Status | Owner |
|----|-------|--------|-------|
| C-01 | `insert_notification()` — SECURITY INVOKER fix | ❌ | Security |
| C-02 | `increment_resource_field()` — SQL injection allowlist | ❌ | Security |
| C-03 | SECURITY DEFINER functions — add `search_path` | ❌ | Security |
| C-04 | `get_upcoming_events()` — draft events leak | ❌ | Security |
| C-05 | `upsert_recently_viewed()` — cross-user manipulation | ❌ | Security |
| C-06 | Plain text password in email → reset link | ❌ | Security |

**Gate 1: ❌ FAILED — All 6 critical issues must be resolved.**

### Gate 2 — All High Issues Resolved

| ID | Issue | Status |
|----|-------|--------|
| H-01–H-17 | 17 high-severity issues (see `docs/FINAL_LAUNCH_AUDIT.md`) | ❌ ALL OPEN |

**Gate 2: ❌ FAILED — 17 high issues remain open.**

### Gate 3 — All Automated Tests Pass

| Suite | Result | Notes |
|-------|--------|-------|
| TypeScript check (`tsc --noEmit`) | ✅ PASS | 0 errors |
| Unit tests (`npm test`) | ✅ PASS | 67/67 pass |
| Production build (`npm run build`) | ✅ PASS | Builds successfully |
| E2E tests (Playwright) | ❌ NOT RUN | Requires staging environment |

**Gate 3: ❌ FAILED — E2E tests not verified.**

### Gate 4 — Rollback Procedures Verified

| Procedure | Status |
|-----------|--------|
| Git rollback | ❌ Not tested |
| Vercel rollback | ❌ Not tested |
| Feature flag rollback | ❌ Not tested |
| Database rollback | ❌ Not tested |
| Edge function rollback | ❌ Not tested |

**Gate 4: ❌ FAILED — No rollback procedures verified.**

### Gate 5 — Staging Validation Succeeded

| Component | Status |
|-----------|--------|
| Auth flow | ❌ Not verified |
| Application flow | ❌ Not verified |
| Mentorship flow | ❌ Not verified |
| Realtime | ❌ Not verified |
| Email delivery | ❌ Not verified |
| Edge functions | ❌ Not verified |

**Gate 5: ❌ FAILED — No staging environment validated.**

---

## Pre-Launch (T-7 Days)

### Security Remediation

- [ ] Fix all 6 CRITICAL issues (C-01 through C-06)
- [ ] Fix all 17 HIGH issues (H-01 through H-17)
- [ ] Re-run security audit
- [ ] Configure CORS to restrict origins
- [ ] Enable rate limiting on edge functions
- [ ] Add email verification check

### Infrastructure

- [ ] Create production Supabase project
- [ ] Link project locally: `supabase link --project-ref <ref>`
- [ ] Push all 45 migrations: `supabase db push`
- [ ] Deploy all 4 edge functions
- [ ] Set edge function secrets (5 secrets)
- [ ] Enable Realtime on tables: messages, notifications, sessions, bookings
- [ ] Create 4 storage buckets with RLS policies
- [ ] Set up Vercel project (or verify existing)
- [ ] Configure Vercel environment variables
- [ ] Configure Sentry project + DSN
- [ ] Configure cron jobs in Supabase (4 jobs)

### Testing

- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] Unit tests: `npm test`
- [ ] Unit test coverage: `npm run test:coverage` (target ≥ 30%)
- [ ] E2E tests against staging: `npx playwright test`
- [ ] Auth flow (signup, login, logout, password reset)
- [ ] Application submission flow
- [ ] Mentor dashboard (calendar, sessions, messaging)
- [ ] Student dashboard (goals, journals, sessions)
- [ ] Messaging + Realtime (multi-tab)
- [ ] File upload (avatars, documents, gallery)
- [ ] Email delivery (welcome, reminders, updates)
- [ ] Gemini AI assistant
- [ ] Scheduled tasks (reminders, alerts, cleanup)
- [ ] Health check endpoint
- [ ] Accessibility audit
- [ ] Performance audit (Lighthouse)

### Operations Setup

- [ ] Configure GitHub Actions backup workflows
- [ ] Configure Sentry alert rules
- [ ] Set up uptime monitoring (Better Uptime / Pingdom)
- [ ] Document incident response contacts
- [ ] Prepare rollback scripts
- [ ] Test rollback procedure on staging

---

## Pre-Deployment (T-48 Hours)

- [ ] Staging deployment verified end-to-end
- [ ] Email templates tested with Resend
- [ ] Health check passing on staging
- [ ] Load testing completed
- [ ] SSL certificate verified
- [ ] Database backup tested (restore to temp project)
- [ ] All team members briefed on rollback procedure

---

## Pre-Deployment (T-24 Hours)

- [ ] Final production build verified
- [ ] Rollback procedure reviewed and practiced
- [ ] Support contact established
- [ ] Monitoring alerts configured
- [ ] Backup of production database taken
- [ ] Rollback preparation:
  ```bash
  git tag pre-deploy-$(date +%Y%m%d)
  pg_dump --format=custom --file=pre-deploy-backup.dump "$PRODUCTION_DATABASE_URL"
  vercel list --prod | head -3 > pre-deploy-vercel.txt
  ```

---

## Launch Day

### T-2 Hours

- [ ] Final health check verification
- [ ] All team members confirmed available
- [ ] Stakeholders notified of launch window
- [ ] Read-only mode on staging (prevent data drift)

### T-1 Hour

- [ ] Run pre-deployment backup
- [ ] Database migration: `supabase db push`
- [ ] Deploy edge functions
- [ ] Verify edge functions responding
- [ ] Verify cron jobs registered

### T-0 (Launch)

- [ ] Deploy frontend: `npm run build && vercel --prod`
- [ ] Wait for Vercel deployment (2-5 min)

### T+5 Minutes

- [ ] Verify application loads at production URL
- [ ] Run health check — all 6 services operational
- [ ] Smoke tests:
  - [ ] Login with test account
  - [ ] Create a goal
  - [ ] Send a message
  - [ ] Upload a file
  - [ ] Trigger an email

### T+15 Minutes

- [ ] Check Sentry for errors (no unexpected spike)
- [ ] Check Supabase dashboard for unusual queries
- [ ] Verify email delivery
- [ ] Monitor Vercel function metrics

### T+1 Hour

- [ ] Review logs for anomalies
- [ ] Check free tier usage metrics
- [ ] Confirm all cron jobs executed
- [ ] Verify Realtime connections established

### T+24 Hours

- [ ] Full day review
- [ ] Check user activity metrics
- [ ] Review error trends
- [ ] Plan post-launch optimizations

---

## Post-Launch (First Week)

- [ ] Daily health check review
- [ ] Daily Sentry error trend review
- [ ] Daily free tier usage monitoring
- [ ] Collect and review user feedback
- [ ] Review application logs for patterns
- [ ] Check backup jobs completed successfully

---

## Post-Launch (First Month)

- [ ] Full performance review
- [ ] Capacity planning for next quarter
- [ ] Dependency update audit
- [ ] Security re-assessment
- [ ] Database index maintenance
- [ ] Documentation update based on lessons learned

---

## Emergency Contacts

| Role | Contact Method |
|------|---------------|
| DevOps / Release Engineer | Primary: Slack, Secondary: Phone |
| Security Incident | Immediate: Phone |
| Supabase Infrastructure | Support ticket via Dashboard |
| Vercel Infrastructure | Support ticket via vercel.com/help |
| Resend (Email) | Support ticket via resend.com/support |
| Sentry (Monitoring) | Support ticket via sentry.io/support |

---

## Rollback Triggers

Rollback immediately if post-deployment:

- [ ] Health check returns `unhealthy` for database or auth
- [ ] > 5% error rate on Sentry in first 15 minutes
- [ ] Authentication completely broken
- [ ] Data integrity issue detected
- [ ] Email delivery completely broken
- [ ] Realtime messaging not working

On rollback trigger: follow [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md), then create incident log.
