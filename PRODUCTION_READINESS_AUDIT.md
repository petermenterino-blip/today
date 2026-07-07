# Production Readiness Audit — Mentorino

**Date:** 2026-07-06
**Scope:** Full-stack audit: env vars, Supabase, RLS, edge functions, frontend, security, performance, deployment, rollback readiness, migration integrity.
**Context:** Pre-deployment audit after removing the Admin role (migrations 038, 9994).

---

## Executive Summary

| Domain | Score | Verdict |
|---|---|---|
| Environment Variables | 4.8 / 10 | **WEAK** — committed secrets, missing vars |
| Supabase Project Config | 6 / 10 | **ACCEPTABLE** — default config mostly OK |
| Row Level Security | 7 / 10 | **ADEGUATE** — 3 anonymous write holes |
| Edge Functions | 4 / 10 | **WEAK** — errors leaked, no timeouts, memory leaks |
| Frontend | 8 / 10 | **GOOD** — minor SonarQube nits |
| Security | 3 / 10 | **CRITICAL** — secrets in git, XSS, no CSP |
| Performance | 7 / 10 | **GOOD** — in-memory rate limiter broken serverless |
| Production Deployment | 6 / 10 | **ACCEPTABLE** — stale deploy, missing vars, Sentry dead |
| Rollback Readiness | 2 / 10 | **CRITICAL** — 038 irreversible, 45/47 migrations no DOWN |
| Migration Integrity | 7 / 10 | **GOOD** — 1 conflict (3 definitions of insert_notification) |

### Overall Production Readiness Score: **54 / 100** — NOT READY

**Go / No-Go: NO-GO**
Fix all CRITICAL and HIGH findings before deploying to production.

---

## 1. Environment Variables Audit

**Score: 4.8 / 10**

### CRITICAL

| Finding | Location | Remediation |
|---|---|---|
| `.env.staging` committed with real `SUPABASE_SERVICE_ROLE_KEY` (starts `eyJ...`) | `.env.staging:2` | `git rm --cached .env.staging`, add to `.gitignore`, rotate the Supabase key |
| Hardcoded service-role JWT in source | `scripts/seedAuthUsers.ts:20` | Replace with env var `SUPABASE_SERVICE_ROLE_KEY` at runtime |
| QA user passwords in plaintext | `scripts/seedAuthUsers.ts:49,53,57` | Use env vars or prompt at runtime |

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| `VITE_APP_ENV` not set in Vercel | Vercel dashboard → Environment Variables | Add `production` for production, `staging` for staging |
| `VITE_ENABLE_EDGE_APPROVAL` not set | Vercel dashboard | Add `true`/`false` |
| `VITE_SENTRY_DSN` ambiguous (contains PostHog key pattern `phc_...`) | `.env.staging:5` | Split into `VITE_SENTRY_DSN` (real Sentry DSN) and `VITE_POSTHOG_API_KEY` (real PostHog key) |
| `VITE_POSTHOG_API_KEY` not set in Vercel | Vercel dashboard | Add after splitting from Sentry variable |
| `RESEND_API_KEY` not set in Supabase secrets | `supabase/functions/resend/index.ts` | Set via `supabase secrets set RESEND_API_KEY=<value>` |
| `GEMINI_API_KEY` not set in Supabase secrets | `supabase/functions/gemini/index.ts` | Set via `supabase secrets set GEMINI_API_KEY=<value>` |
| `SENTRY_AUTH_TOKEN` not set | Sentry source map upload | Set in Vercel for source map uploads |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| `VITE_NODE_ENV` referenced but not standard Vite | `vite.config.ts` | Use `VITE_APP_ENV` instead |
| Hardcoded `supabaseUrl` fallback | Multiple files | Always use env var, no fallback |
| `.env.example` missing all new vars | `.env.example` | Add documented entries for every `VITE_*` var |

---

## 2. Supabase Project Config Audit

**Score: 6 / 10**

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| SMTP configured to Resend but auth confirmation not enforced | Auth → Settings → SMTP | Enable "Confirm email" for signups |
| No CAPTCHA protection on auth endpoints | Auth → Settings → Security | Enable HCaptcha/Cloudflare Turnstile |
| Session length: 3600s (1 hour) — short for mentor workflows | Auth → Settings → Sessions | Increase to 86400 (24h) for mentors |
| No Multi-Factor Authentication enforced | Auth → Settings → MFA | Enable MFA for mentor role |
| Rate limiting at defaults (30 req/min) | Auth → Settings → Rate Limiting | Lower to 10 req/min for signups |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| Allowed origins includes `*` wildcard | Auth → Settings → Allowed Origins | Restrict to specific Vercel domains |
| API key rate limits at defaults | API → Settings | Set per-endpoint limits |
| Webhook forwarding not configured | Database → Webhooks | Set up for critical events (user signup, payment) |
| Point-in-time Recovery not enabled | Database → Backups | Enable PITR (7-day) for production |
| No read replica configured | Database → Replication | Add replica for reporting queries |
| Database size: `1155 MB` (unlimited plan) | Database → Usage | Monitor growth; consider read replica |

---

## 3. Row Level Security Audit

**Score: 7 / 10**

### CRITICAL

| Finding | Location | Remediation |
|---|---|---|
| Anonymous INSERT on `storage.objects` for `student-documents` bucket | `supabase/migrations/9991_optimization.sql` | Add `auth.role() = 'authenticated'` check to INSERT policy |
| No INSERT policy on `applications` — anonymous users can apply | `supabase/migrations/9991_optimization.sql` | Add RLS policy: `(auth.role() = 'authenticated')` |
| Anonymous INSERT on `visitor_bookings` | `supabase/migrations/9991_optimization.sql` | Add RLS policy: `(auth.role() = 'authenticated')` |

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| `student-documents` bucket publicly accessible | Supabase Dashboard → Storage | Restrict to authenticated users with mentor/student role check |
| Policy uses `role() = 'authenticated'` but not `(SELECT role FROM profiles)` for student/mentor distinction | Multiple migration files | Add role-check subquery for write operations |
| `applications` SELECT policy allows all authenticated — leaks student data cross-tenant | `9991_optimization.sql` | Mentor should only see own applications |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| Inconsistent `role` column quoting (`'role'` vs `role`) | Various migration files | Normalize to unquoted `role` |
| No RLS on `audit_log` table | `supabase/migrations/` | Add read-only SELECT for mentors |
| `profiles` UPDATE policy allows students to modify own `role` column | `9991_optimization.sql` | Restrict: only mentors can change role |
| `user_roles` table exists but not used by RLS policies | `supabase/migrations/` | Either remove or migrate role checks to it |

---

## 4. Edge Functions Audit

**Score: 4 / 10**

### CRITICAL

| Finding | Location | Remediation |
|---|---|---|
| 4 of 5 edge functions leak `err.message` to caller | All `index.ts` files | Return generic "Internal server error", log details server-side |
| In-memory rate limiter broken in serverless (Vercel edge, Supabase) | `middleware/auth.ts:60-90` | Replace with Supabase `rate_limits` table or external store |
| No `requireRole()` guard on most `gemini` endpoints | `supabase/functions/gemini/index.ts` | Add role check before every handler |
| Module-scope `setInterval` creates memory leak | `middleware/auth.ts` | Remove or use singleton pattern |

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| `getCorsHeaders` declared twice (duplicate) | `middleware/auth.ts` | Remove one declaration |
| No request timeout on functions with 5s limit | All `index.ts` | Add `Promise.race` with timeout |
| Missing CORS preflight (`OPTIONS`) on `gemini` | `supabase/functions/gemini/index.ts:1-30` | Add OPTIONS handler |
| `resend` has multiple role checks with different RBAC approaches | `supabase/functions/resend/index.ts` | Normalize to single `requireRole()` pattern |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| No request ID / correlation ID | All functions | Generate `x-request-id` in middleware |
| No centralized error handler | All functions | Create shared `errorHandler.ts` |
| Undocumented env vars in `gemini` | `supabase/functions/gemini/index.ts` | Add comments for each `Deno.env.get()` |
| No input validation on function params | All functions | Add Zod or manual validation before processing |
| Hardcoded timeout values | `approve-application/index.ts:100` | Make configurable via env var |

---

## 5. Frontend Audit

**Score: 8 / 10**

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| `dangerouslySetInnerHTML` in AI Dashboard without sanitization | `src/features/ai/AIAssistant.tsx` | Use DOMPurify or `sanitize-html` |
| Lazy import path still references `../admin/` | `src/features/mentor/MentorDashboard.tsx` | Rename directory or add comment (no-op, works) |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| 2 known bugs in `VITE_SUPABASE_KEY` → `VITE_SUPABASE_ANON_KEY` transition | Various files | Fix remaining references |
| SonarQube: 5 code smells (duplicate strings, magic numbers) | Various | Extract constants |
| SonarQube: 3 cognitive complexity warnings | `src/features/messaging/` | Refactor deeply nested conditionals |
| Missing React key props in mapped lists | `src/components/shared/` | Add unique keys |
| No error boundary per route | `src/app/App.tsx` | Wrap each route in ErrorBoundary |

### LOW

| Finding | Location | Remediation |
|---|---|---|
| Unused CSS classes | `src/styles/` | Remove with PurgeCSS |
| Missing `aria-label` on icon-only buttons | Various | Add accessibility labels |

---

## 6. Security Audit

**Score: 3 / 10**

### CRITICAL

| Finding | Location | Remediation |
|---|---|---|
| Secrets committed to git (see §1) | `.env.staging`, `scripts/seedAuthUsers.ts` | Remove, rotate, `.gitignore` |
| XSS via `dangerouslySetInnerHTML` | `src/features/ai/AIAssistant.tsx` | Sanitize with DOMPurify |
| Anonymous write vectors on 3 tables (see §3) | Storage, applications, visitor_bookings | Add RLS policies |
| Error message leakage in 4 edge functions | All `index.ts` | Return generic errors |

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| Temporary password sent in plaintext email | `resend/index.ts` | Force password reset via magic link instead |
| Logger JWT truncated before redaction | `middleware/auth.ts` | Redact before truncating |
| No CSRF protection | Frontend | Add CSRF token or `SameSite=Strict` cookies |
| No Content-Security-Policy headers | All responses | Set `Content-Security-Policy` header |
| No HSTS, X-Content-Type-Options, X-Frame-Options | All responses | Set security headers in middleware |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| CORS `credentials: true` with `*` origin | `middleware/auth.ts` | Specify exact origin |
| Supabase anon key in client bundle (acceptable, but rate-limit) | `src/lib/supabase.ts` | Ensure rate limiting on anon key |
| No IP allowlisting for Supabase dashboard | Supabase Dashboard | Restrict to office/VPN IPs |
| Service role key used in client-accessible function | `approve-application/index.ts` | Move to server-only context |

---

## 7. Performance Audit

**Score: 7 / 10**

### CRITICAL

| Finding | Location | Remediation |
|---|---|---|
| In-memory rate limiter resets per instance | `middleware/auth.ts` | Replace with persistent store |
| `setInterval` in module scope never clears | `middleware/auth.ts` | Add cleanup on function dispose |

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| No query pagination on large tables | `mentor/dashboard` queries | Add LIMIT/OFFSET or cursor pagination |
| No database connection pooling | Edge functions | Use Supabase Pooler (port 6543) |
| No Supabase Query Plan analysis performed | N/A | Run `EXPLAIN ANALYZE` on top 5 queries |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| Unoptimized image assets | `src/assets/` | Compress with WebP/AVIF |
| No lazy loading below-fold | `src/features/` | Add `loading="lazy"` and IntersectionObserver |
| No bundle analysis run | `package.json` | Add `vite-bundle-analyzer` |
| No response compression on edge functions | All functions | Add `Content-Encoding: gzip` |

---

## 8. Production Deployment Audit

**Score: 6 / 10**

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| Latest production deploy is 22h old | Vercel Dashboard | Redeploy from `main` |
| Staging deploy uses `today-ld5qxsuyj-mentorino.vercel.app` | Vercel Dashboard | Verify all flows before promoting |
| `ensureBucket()` removal committed but not deployed | Previous session | Deploy or revert staging |
| Missing 6 Vercel environment variables | Vercel Dashboard | Add all documented `VITE_*` vars |
| Sentry not connected (DSN set but no `SENTRY_AUTH_TOKEN`, dashboard shows no activity) | Sentry dashboard | Complete Sentry setup |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| No deploy checklist / runbook | `docs/` | Create deploy runbook |
| No canary deployments | Vercel Dashboard | Configure Vercel Preview with production env |
| No health check endpoint | Edge functions | Add `GET /health` returning `{ status: "ok" }` |
| No monitoring dashboards | Grafana/Datadog | Set up basic dashboard |

---

## 9. Rollback Readiness Audit

**Score: 2 / 10**

### CRITICAL

| Finding | Location | Remediation |
|---|---|---|
| Migration 038 has NO rollback — `UPDATE profiles SET role = 'mentor' WHERE role = 'admin'` is irreversible | `038_remove_admin_role.sql` | Create `038_down.sql`: `UPDATE profiles SET role = 'admin' WHERE email IN (...)` using backup |
| 45 of 47 migrations (96%) have no DOWN section | All migration files | Add DOWN sections for all migrations |
| No backup taken before migration 038 applied | N/A | Document manual backup step for future migrations |

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| No rollback tested or documented | N/A | Test rollback on staging before production |
| No pre-migration snapshot of production database | N/A | Enable PITR on production |
| 9994 migration depends on 9991 behavior (which re-creates admin policies) — fragile ordering | `9991_optimization.sql` | Inline the 9994 cleanup into 9991 instead |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| No migration dry-run process documented | `docs/` | Add `supabase db push --dry-run` to workflow |
| No git tag for current deployment state | Git | Tag current HEAD before next deploy |

---

## 10. Migration Integrity Audit

**Score: 7 / 10**

### HIGH

| Finding | Location | Remediation |
|---|---|---|
| 3 migration files define `public.insert_notification()` with different signatures | `022_notifications.sql`, `028_notification_preferences.sql`, `033_notifications.sql` | Consolidate to single definition, drop duplicates |
| Migration 9994 would fail if 9991 was never applied | `9994_remove_admin_policies.sql` | Make DROP IF EXISTS idempotent |

### MEDIUM

| Finding | Location | Remediation |
|---|---|---|
| Migration filenames not sequential (gap 000–038, then 9991, 9994) | `supabase/migrations/` | Rename to sequential or accept Supabase tooling handles ordering |
| No migration checksum verification | N/A | Enable migration checksums for tamper detection |
| Migration files committed without SQL linting | N/A | Add `sqlfluff` or `pg_format` to CI |

---

## Remediation Roadmap

### Immediate (before deployment)

1. **Rotate compromised keys** — rotate Supabase service_role key, remove `.env.staging` from git
2. **Fix RLS holes** — add `auth.role() = 'authenticated'` to storage.objects, applications, visitor_bookings INSERT policies
3. **Stop leaking errors** — wrap all 4 edge function handlers with generic error responses
4. **Sanitize AI output** — install DOMPurify, wrap `dangerouslySetInnerHTML`
5. **Fix rate limiter** — replace in-memory with DB-backed rate limiting
6. **Set all env vars** — add missing VITE_* vars to Vercel, set Supabase secrets

### Within 1 week

7. **Add DOWN migration for 038** — with backup of affected rows
8. **Add DOWN sections** for remaining 45 migrations
9. **Fix duplicate `getCorsHeaders`**, `setInterval` leak
10. **Add requireRole()** to all unprotected gemini endpoints
11. **Set up Sentry** — DSN + auth token + source maps

### Within 1 month

12. **Enable CSP, HSTS, security headers**
13. **Replace plaintext temp passwords** with magic links
14. **Consolidate duplicate `insert_notification()` functions**
15. **Add health check endpoint**
16. **Configure PITR and read replica**
17. **Add deploy runbook and rollback playbook**
18. **Run load test against staging**

---

## Appendix: Audit Methodology

- **Environment Variables:** Manual review of `.env.*` files, Vercel dashboard, Supabase secrets, `git log` for secrets
- **Supabase Config:** Dashboard review of Auth, API, Database settings
- **RLS:** Manual review of all migration files and current DB policies
- **Edge Functions:** Full source read of all 5 functions
- **Frontend:** Grep for `dangerouslySetInnerHTML`, React lint violations, accessibility patterns
- **Security:** Secrets discovery, XSS audit, CSRF, header audit, RLS review
- **Performance:** Code review of rate limiting, pagination, asset optimization
- **Deployment:** Vercel deploy history, env var comparison, Sentry status check
- **Rollback:** Migration file review, `DOWN` section presence, data irreversibility
- **Migration Integrity:** Cross-file grep for function definitions, policy ordering, naming conventions
