# Production Checklist

**Date:** 2026-07-06  
**Environment:** Staging (rpxcrgpxyuvhnhnopvpa.supabase.co) → Production

---

## 1. Pre-Launch

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1.1 | Database migrations applied | ✅ | All migrations up to 0302 |
| 1.2 | Edge functions deployed | ✅ | gemini, resend, approve-application, scheduled |
| 1.3 | Secrets configured in production | ⚠️ **ACTION NEEDED** | Verify `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY` in prod |
| 1.4 | Supabase project type upgraded (free → pro) | ⚠️ **ACTION NEEDED** | Free tier: 500MB DB, 2GB bandwidth |
| 1.5 | Custom domain configured | ⚠️ **ACTION NEEDED** | If using custom domain, verify SSL + redirects |

---

## 2. Authentication

| # | Check | Status | Details |
|---|-------|--------|---------|
| 2.1 | Auth providers configured | ✅ | Email/password + Google (if needed) |
| 2.2 | Email templates customized | ✅ | Welcome email now includes temp password |
| 2.3 | Rate limiting enabled | ✅ | Built-in Supabase Auth rate limits |
| 2.4 | Redirect/whitelist URLs configured | ⚠️ **ACTION NEEDED** | Verify prod URL in Auth settings |

---

## 3. Email (Resend)

| # | Check | Status | Details |
|---|-------|--------|---------|
| 3.1 | Sender domain verified | ⚠️ **ACTION NEEDED** | Verify `notifications@mentorino.com` in Resend |
| 3.2 | SPF/DKIM/DMARC configured | ⚠️ **ACTION NEEDED** | DNS records for deliverability |
| 3.3 | Email quota sufficient | ⚠️ **ACTION NEEDED** | Free tier: 100/day — upgrade to paid if needed |
| 3.4 | Bounce/error handling | ✅ | Errors caught and logged |

---

## 4. Storage

| # | Check | Status | Details |
|---|-------|--------|---------|
| 4.1 | Bucket policies verified | ✅ | All buckets have RLS |
| 4.2 | `shared_files` bucket in migration | ⚠️ **ACTION NEEDED** | Currently created at runtime — add to migration |
| 4.3 | File size limits configured | ✅ | Per-bucket + client-side validation |
| 4.4 | Orphan cleanup plan | ❌ Not implemented | No cleanup on user deletion |

---

## 5. Edge Functions

| # | Check | Status | Details |
|---|-------|--------|---------|
| 5.1 | All functions deployed | ✅ | gemini, resend, approve-application, scheduled |
| 5.2 | Rate limits configured | ✅ | Gemini: 30/min, Resend: 10/min |
| 5.3 | CORS configured for production domain | ⚠️ **ACTION NEEDED** | Update `CORS_HEADERS` origin for prod URL |
| 5.4 | Logging/monitoring | ⚠️ None | No structured error tracking |
| 5.5 | Duplicate `getCorsHeaders` in middleware | ⚠️ **MINOR** | Lines 91 and 107 — clean up |

---

## 6. Monitoring & Observability

| # | Check | Status | Details |
|---|-------|--------|---------|
| 6.1 | Error tracking (Sentry/Logflare) | ❌ Not integrated | No error reporting |
| 6.2 | Uptime monitoring | ❌ Not integrated | No external health check |
| 6.3 | Performance monitoring | ❌ Not integrated | No APM |
| 6.4 | Analytics events | ✅ | Custom `analytics_events` table with inserts |

---

## 7. Backup & Disaster Recovery

| # | Check | Status | Details |
|---|-------|--------|---------|
| 7.1 | Database backups | ✅ | Supabase daily backups (pro) |
| 7.2 | Rollback plan | ✅ | Git reverts + DB migration reverts |
| 7.3 | Secrets backup | ⚠️ **ACTION NEEDED** | Store API keys in password manager |

---

## 8. Legal & Compliance

| # | Check | Status | Details |
|---|-------|--------|---------|
| 8.1 | Privacy policy | ⚠️ Not verified | Legal review needed |
| 8.2 | Terms of service | ⚠️ Not verified | Legal review needed |
| 8.3 | GDPR compliance | ⚠️ Not verified | EU users: cookie consent, data deletion |
| 8.4 | Unsubscribe mechanism in emails | ❌ **MISSING** | No `List-Unsubscribe` header in any email |

---

## 9. Release Blockers (Showstoppers)

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 9.1 | Welcome email missing temp password | **CRITICAL** | ✅ **FIXED** |
| 9.2 | Sender domain verification in Resend | HIGH | Must verify domain before prod |
| 9.3 | `VITE_SUPABASE_*` confirm they're anon keys | HIGH | Check values in prod `.env` |

---

## Summary

⚠️ **CONDITIONAL PASS** — 3 action items required before production launch:
1. Verify sender domain in Resend (SPF/DKIM)
2. Confirm `VITE_SUPABASE_*` vars use anon keys (not service keys)
3. Add `shared_files` bucket to migrations
