# Final Deployment Checklist

**Date:** 2026-07-06
**Application:** Mentorino
**Build:** v0.0.0
**Status:** ❌ BLOCKED — See FINAL_GO_NO_GO.md

---

## Pre-Deployment Actions (Required Before First Deploy)

### Security Remediation

- [ ] **C-01:** Fix `insert_notification()` — convert to SECURITY INVOKER or add auth.uid() check
- [ ] **C-02:** Fix `increment_resource_field()` — add field allowlist
- [ ] **C-03:** Fix all SECURITY DEFINER functions — add `SET search_path = public`
- [ ] **C-04:** Fix `get_upcoming_events()` — remove `'draft'` from status filter
- [ ] **C-05:** Fix `upsert_recently_viewed()` — use `auth.uid()` instead of parameter
- [ ] **C-06:** Stop sending passwords in email — use password reset link
- [ ] **H-01:** Strengthen temp password generation — use full ASCII character set
- [ ] **H-02:** Fix gallery RLS — restrict to published items or owner
- [ ] **H-03:** Add spam protection to applications — rate limiting/CAPTCHA
- [ ] **H-04:** Restrict `public-website` bucket write — mentor only
- [ ] **H-05:** Fix anonymous document read — require auth or per-user scope
- [ ] **H-06:** Fix `message-attachments` LIKE pattern — use exact path matching
- [ ] **H-07:** Sanitize Gemini context — strip PII before sending
- [ ] **H-08:** Sanitize Gemini error responses — prevent key leakage
- [ ] **H-09:** Move Gemini API key from URL to header — use `X-Goog-Api-Key`
- [ ] **H-10:** Fix JWT role fallback — default to most restrictive role
- [ ] **H-11:** Fix HTML injection in email templates — escape all dynamic values
- [ ] **H-12:** Restrict CORS origins — scoped to `https://mentorino.app`
- [ ] **H-13:** Add rate limiting to all edge functions
- [ ] **H-14:** Add email verification check before granting access
- [ ] **H-15:** Make Sentry mandatory in production
- [ ] **H-16:** Increase unit test coverage to minimum 30%
- [ ] **H-17:** Add security scanning to CI/CD pipeline

### Infrastructure Setup

- [ ] Create staging Supabase project
- [ ] Link staging project locally: `supabase link`
- [ ] Push all migrations to staging: `supabase db push`
- [ ] Deploy edge functions to staging
- [ ] Configure edge function secrets (SUPABASE_URL, SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET, GEMINI_API_KEY)
- [ ] Enable Realtime on tables: messages, notifications, sessions, bookings
- [ ] Create storage buckets (x6)
- [ ] Configure S3-compatible storage (if using Supabase tier)
- [ ] Set up Vercel project for staging
- [ ] Configure Vercel environment variables

### Testing on Staging

- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Run unit tests: `npm test`
- [ ] Run E2E tests: `npx playwright test`
- [ ] Test authentication flow (signup, login, logout, password reset)
- [ ] Test application submission (anonymous → approved → provisioned)
- [ ] Test mentor dashboard (calendar, sessions, messaging)
- [ ] Test student dashboard (goals, journals, sessions)
- [ ] Test messaging (send, receive, attachments)
- [ ] Test file upload (avatars, documents, gallery)
- [ ] Test Realtime (multi-tab message delivery, notification push)
- [ ] Test email delivery (welcome, reminder, application update)
- [ ] Test Gemini AI assistant
- [ ] Test scheduled tasks (reminders, alerts, cleanup)
- [ ] Test health check endpoint
- [ ] Verify all feature flags work correctly
- [ ] Run accessibility audit
- [ ] Run performance audit (Lighthouse)

## Deployment Steps

### Step 1: Database Migration

- [ ] Create backup of production database
- [ ] Push migrations to production: `supabase db push`
- [ ] Verify all RLS policies active
- [ ] Run data integrity checks
- [ ] Verify Realtime enabled on correct tables
- [ ] Verify storage buckets and policies

### Step 2: Edge Functions

- [ ] Deploy all 4 edge functions:
  ```bash
  supabase functions deploy approve-application
  supabase functions deploy gemini
  supabase functions deploy resend
  supabase functions deploy scheduled
  ```
- [ ] Verify function secrets configured
- [ ] Test each function endpoint
- [ ] Configure Supabase cron jobs for scheduled tasks

### Step 3: Frontend Deployment

- [ ] Ensure `master` branch is up to date
- [ ] Verify CI pipeline passes (typecheck → unit-tests → e2e-tests → build)
- [ ] Create release tag: `git tag v1.0.0 && git push --tags`
- [ ] Deploy to Vercel production:
  ```bash
  vercel --prod
  ```
- [ ] Verify deployment successful in Vercel Dashboard

### Step 4: Post-Deployment Verification

- [ ] Visit production URL — page loads without errors
- [ ] Run health check — all 6 services operational
- [ ] Test public pages (Landing, About, Programs, FAQ, Contact)
- [ ] Test authentication (login with test account)
- [ ] Test student flow (create goals, journal entry, view sessions)
- [ ] Test mentor flow (view dashboard, manage schedule, message student)
- [ ] Test mentor flow (manage applications, events, gallery)
- [ ] Test file uploads (avatar, document, gallery image)
- [ ] Test email delivery (welcome email to test account)
- [ ] Test Gemini AI (chat assistant)
- [ ] Test password reset flow
- [ ] Verify Sentry is receiving events (create test error)
- [ ] Verify SSL certificate (HTTPS forced)
- [ ] Verify robots.txt and meta tags
- [ ] Verify sitemap.xml (if applicable)

### Step 5: Monitoring Setup

- [ ] Configure Sentry alert rules (error rate > threshold)
- [ ] Configure health check monitoring (every 5 minutes)
- [ ] Set up uptime monitoring (e.g., Better Uptime, Pingdom)
- [ ] Configure Supabase project monitoring
- [ ] Set up Vercel deployment notifications
- [ ] Document incident response contacts

## Rollback Preparation

- [ ] Tag current production state: `git tag pre-deploy-v1`
- [ ] Database backup downloaded
- [ ] Rollback scripts prepared and reviewed
- [ ] Vercel previous deployment noted
- [ ] Feature flags confirmed functional
- [ ] Rollback guide accessible

## Launch Day Sequence

### T-2 Hours
- [ ] Final health check verification
- [ ] Confirm all team members available
- [ ] Notify stakeholders of launch window
- [ ] Enable read-only mode on staging (prevent data drift)

### T-1 Hour
- [ ] Run pre-deployment backup
- [ ] Begin database migration
- [ ] Deploy edge functions
- [ ] Verify edge functions operational

### T-0 (Launch)
- [ ] Deploy frontend to Vercel
- [ ] Wait for deployment to complete (2-5 min)
- [ ] Run health check
- [ ] Run smoke tests (auth, CRUD, realtime)

### T+15 Minutes
- [ ] Check Sentry for errors
- [ ] Check Supabase for unusual query patterns
- [ ] Monitor Vercel function metrics
- [ ] Verify email delivery

### T+1 Hour
- [ ] Review logs for any anomalies
- [ ] Check free tier usage metrics
- [ ] Confirm all cron jobs executed

### T+24 Hours
- [ ] First full-day review
- [ ] Check user activity metrics
- [ ] Review error trends
- [ ] Plan post-launch optimizations

## Emergency Contacts

| Role | Contact | Channel |
|------|---------|---------|
| DevOps Lead | Project maintainer | Slack/Discord |
| Security Incident | Project maintainer | Pager/Phone |
| Infrastructure (Supabase) | Supabase Dashboard | Support ticket |
| Infrastructure (Vercel) | Vercel Dashboard | Support ticket |

## Post-Launch Tasks

### Day 1
- [ ] Monitor error rates
- [ ] Verify all email templates deliver correctly
- [ ] Check realtime subscription counts
- [ ] Verify scheduled tasks executed

### Week 1
- [ ] Review performance metrics
- [ ] Check free tier usage against projections
- [ ] Gather user feedback
- [ ] Review security logs
- [ ] Plan Phase 2 security fixes

### Month 1
- [ ] Full performance review
- [ ] Capacity planning for next quarter
- [ ] Dependency update audit
- [ ] Security re-assessment
- [ ] Database index maintenance
