# RELEASE MANAGER CHECKLIST — Mentorino Production Launch

**Prepared by:** Production Release Manager  
**Date:** Mon Jul 06 2026  
**Application:** Mentorino — Premium Mentorship Platform  
**Repository:** `https://github.com/petermenterino-blip/today.git`  
**Current Branch:** `master`  
**Release Tag:** `v1.0-stable`  
**Current Version:** `0.0.0` (package.json)

---

## EXECUTIVE SUMMARY

| Item | Status | Risk Level |
|---|---|---|
| **Overall Readiness** | ⚠️ CONDITIONAL GO | **Medium** |
| **Estimated Deployment Time** | 45 minutes | — |
| **Estimated Downtime** | < 5 minutes (Vercel zero-downtime deploys) | — |
| **Expected Impact** | Public launch — real users, real data, real money | **High** |
| **Rollback Capability** | ✅ Git revert + Vercel instant rollback | — |

---

## 1. GITHUB REPOSITORY

| Check | Status | Details | Owner | Risk |
|---|---|---|---|---|
| Repository name | ⚠️ Warning | `today` — not production-appropriate; rename recommended | PM | Low |
| Repository visibility | ⚠️ Warning | Assumed private (verify before launch) | DevOps | Low |
| Branch protection | ⚠️ Warning | No branch protection rules visible on `master` or `stable-v1` | DevOps | Medium |
| CODEOWNERS | ❌ Critical | Not configured — no required reviewers for PRs | DevOps | High |
| Repository secrets (Actions) | ❌ Critical | Must verify all CI secrets are set (Sentry, Supabase, Resend, Gemini, Google) | DevOps | High |

**Action Items:**
- [ ] Rename repository from `today` to `mentorino` or `mentorino-platform`
- [ ] Enable branch protection on `master` and `stable-v1` (require PR reviews, status checks)
- [ ] Create `.github/CODEOWNERS` file
- [ ] Set all GitHub Actions secrets (CI needs Supabase staging URL, test user credentials)

---

## 2. BRANCHES

| Branch | Status | Ahead of master | Notes |
|---|---|---|---|
| `master` | ✅ Current production target | — | Clean, building, tests pass |
| `stable-v1` | ✅ Exists | 0 commits (only `.gitignore` diff) | Ready for release cut |
| `origin/main` | ⚠️ Orphaned | Present but not in use | Delete or align |
| `origin/develop` | ❌ Not found | — | CI triggers on push to `develop` but branch doesn't exist |

**Action Items:**
- [ ] Create `develop` branch if CI expects it
- [ ] Remove `origin/main` or merge into `master`
- [ ] Consider: merge `stable-v1` into `master` or tag from `master` directly

---

## 3. COMMIT HISTORY

| Check | Status | Details |
|---|---|---|
| Total commits | ✅ 60 commits | Clean history, follows conventional commits |
| Latest commit | `d5dde7f` — "chore: add test artifacts and schema dump to gitignore" | Recent (Jul 5 2026) |
| Signed commits | ⚠️ Not verified | No GPG signing evident |
| Commit quality | ✅ Good | `feat:` / `fix:` / `chore:` / `perf:` prefixes used consistently |

**Action Items:**
- [ ] (Optional) Enable GPG commit signing requirement for production branch

---

## 4. PRODUCTION BRANCH

| Check | Status | Details |
|---|---|---|
| `master` is production-ready | ✅ Yes | All tests pass, build succeeds, types check |
| `stable-v1` is production-ready | ✅ Yes | Identical to `master` minus `.gitignore` changes |
| Merge strategy defined | ❌ Not documented | No CONTRIBUTING.md or merge strategy defined |

**Action Items:**
- [ ] Define and document merge strategy (rebase-merge vs squash-merge)

---

## 5. STAGING BRANCH

| Check | Status | Details |
|---|---|---|
| Staging deployment | ✅ Working | `origin/master` deployed to Vercel staging |
| Staging Supabase project | ✅ Configured | `mentarino-staging` (ref: `rpxcrgpxyuvhnhnopvpa`) |
| Staging environment variables | ✅ Set | `.env.staging` has real Supabase URL, anon key, service role key |
| Staging edge function secrets | ✅ Set via `supabase secrets set` | RESEND_API_KEY, GEMINI_API_KEY, CRON_SECRET confirmed |
| Staging E2E tests pass | ✅ Verified | 43/43 E2E tests pass against staging |

---

## 6. VERSION NUMBER

| Check | Status | Details | Owner |
|---|---|---|---|
| package.json version | ❌ `0.0.0` | Must be updated to `1.0.0` before release | Release Manager |
| Semantic versioning | ✅ Semver-compliant | Format `MAJOR.MINOR.PATCH` | — |
| Version consistency | ❌ Not verified | Only checked package.json; check in code, configs | Release Manager |

**Action Items:**
- [ ] Update `package.json` version to `1.0.0`
- [ ] Search for any hardcoded version strings in the codebase

---

## 7. RELEASE TAG

| Check | Status | Details |
|---|---|---|
| Tag exists | ✅ `v1.0-stable` exists | Created but not pushed? Check origin tags |
| Tag pushed to remote | ⚠️ TBD | Verify: `git push origin v1.0-stable` |
| Annotated tag | ⚠️ Lightweight | `git tag -a v1.0.0 -m "Mentorino v1.0.0 — Initial public release"` |
| Release on GitHub | ❌ Not created | Must create GitHub Release with changelog |

**Action Items:**
- [ ] `git tag -a v1.0.0 -m "Mentorino v1.0.0 — Initial public release"`
- [ ] `git push origin v1.0.0`
- [ ] Create GitHub Release with changelog summary
- [ ] Consider deleting `v1.0-stable` in favor of proper semver tag

---

## 8. CHANGELOG

| Check | Status | Details |
|---|---|---|
| CHANGELOG.md exists | ❌ **Critical** | No CHANGELOG file found anywhere in the repository |
| Release notes drafted | ❌ Not done | No release notes exist |

**Action Items:**
- [ ] Generate CHANGELOG.md from commit history
- [ ] Include all modules (1-22), security fixes, production hardening
- [ ] Link to GitHub Releases when published

---

## 9. ENVIRONMENT VARIABLES

### Production Required Variables (validated by `src/lib/envValidator.ts`)

| Variable | Status | Current Value | Required Format |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ❌ **Critical** | `https://xxxxxxxxxxxxxxxxxxxx.supabase.co` (placeholder) | Must start with `https://`, contain `supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ❌ **Critical** | `eyJxxxxx_production_anon_key_xxxxx` (placeholder) | Must start with `eyJ`, length > 50 |
| `VITE_APP_ENV` | ✅ Set | `production` | — |
| `VITE_SENTRY_DSN` | ❌ **Critical** | `https://xxxxx@xxxxx.ingest.us.sentry.io/xxxxx` (placeholder) | Must be a valid Sentry DSN — envValidator rejects "xxxxx" pattern |

### Production Optional Variables

| Variable | Status | Notes |
|---|---|---|
| `VITE_ENABLE_EDGE_APPROVAL` | ✅ Set to `true` | Correct for production |
| `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | ❗ Set to `false` | Recommended to enable only after staging verification; consider enabling for production |
| `VITE_POSTHOG_API_KEY` | ❌ **Not set** | Empty — PostHog analytics will not work |
| `VITE_POSTHOG_HOST` | ❌ **Not set** | Empty — PostHog analytics will not work |

### Edge Function Secrets (must be set via `supabase secrets set`)

| Secret | Production Status | Staging Status |
|---|---|---|
| `SUPABASE_URL` | ❌ Not set | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Not set | ✅ Set |
| `RESEND_API_KEY` | ❌ Not set | ✅ Set |
| `GEMINI_API_KEY` | ❌ Not set | ✅ Set |
| `CRON_SECRET` | ❌ Not set | ✅ Set |

### Vercel Environment Variables

| Variable | Production Status | Notes |
|---|---|---|
| All `VITE_*` vars | ❌ **Not configured in Vercel** | Must be set in Vercel Project Settings → Environment Variables |
| Node version | ✅ `20.x` | Set in `vercel.json` |

**Action Items:**
- [ ] Create production Supabase project
- [ ] Set all 4 required env vars in Vercel production environment
- [ ] Set all 5 edge function secrets via `supabase secrets set` on production project
- [ ] Configure PostHog project and set API key/host
- [ ] Verify `envValidator.ts` passes in production build

---

## 10. SECRETS

| Check | Status | Details | Risk |
|---|---|---|---|
| Supabase service role key exposed in `.env.staging` | ⚠️ Warning | Present in `.env.staging` and `.env.local` — ensure these files never enter production CI | **Critical** |
| `.env.production` contains placeholder secrets | ✅ Safe | Only placeholders, no real secrets | Low |
| Sentry DSN in source code | ⚠️ Warning | DSN is `import.meta.env.VITE_SENTRY_DSN` — standard practice, not hardcoded | Low |
| Supabase anon key in source | ✅ Acceptable | Anon key is safe for client-side (RLS enforces security) | Low |
| Service role key in env files | ❌ **Critical** | `SUPABASE_SERVICE_ROLE_KEY` present in `.env.staging` — must never be in Vite env (protected by `VITE_` prefix convention) | High |
| API keys in git history | ⚠️ Check required | Search for any committed keys in git history | High |

**Action Items:**
- [ ] Run `git log --all --diff-filter=A -- .` with secret scanning
- [ ] Rotate any secrets found in git history
- [ ] Verify `.env.production` does not contain service role key
- [ ] Add `.env.staging` to `.gitignore` if not already

---

## 11. DATABASE MIGRATIONS

| Check | Status | Details |
|---|---|---|
| Migration count | ✅ 48 files | 001-040 + 900 + 9990-9994 |
| Final migration | ✅ `040_finalize_security.sql` | Finalizes security definitions, RLS, fixed recursion |
| Gaps in numbering | ⚠️ Warning | Jump from 018→020 (missing 019), 029→030→0301 (sub-numbering), 032→033→034→035 |
| Duplicate numbering | ⚠️ Warning | `028_gallery_module.sql` and `028_visitor_bookings_crm.sql` (original deleted, renumbered to 9993) |
| `999*` files | ⚠️ Warning | `9990_rls.sql`, `9991_optimization.sql`, `9992_fix_rls_recursion.sql`, `9993_visitor_bookings_crm.sql`, `9994_remove_admin_policies.sql` — these are late additions that could conflict |
| 900 series | ⚠️ Warning | `900_auth_triggers.sql` — out of sequence |

**Action Items:**
- [ ] Consolidate migration numbering before production (eliminate 999* files, renumber properly)
- [ ] Test fresh migration from scratch on clean production database
- [ ] Verify `supabase migration list` shows clean state
- [ ] Document migration ordering dependencies

---

## 12. EDGE FUNCTIONS

| Function | JWT Verify | Rate Limited | Status | Notes |
|---|---|---|---|---|
| `gemini` (Gemini AI) | ✅ Yes | ✅ Yes (30/min) | ✅ Ready | Uses `gemini-2.0-flash`, streaming support |
| `resend` (Email) | ✅ Yes | ✅ Yes (10/min) | ✅ Ready | Escape HTML, 4 templates (welcome, session_reminder, application_update, notification) |
| `scheduled` (Cron jobs) | ❌ No (CRON_SECRET) | ✅ Yes (2/min) | ✅ Ready | Session reminders, inactivity alerts, progress summaries |
| `approve-application` (Provisioning) | ✅ Yes | ✅ Yes (5/min) | ✅ Ready | Dual-mode (Phase 2 simple / Phase 3 state machine), rollback capability |
| `middleware/auth` (Shared) | — | — | ✅ Ready | JWT verify, role check, CORS, rate limiting, audit logger |

**Action Items:**
- [ ] Deploy all edge functions to production Supabase: `supabase functions deploy --project-ref <prod-ref>`
- [ ] Verify production function secrets are set
- [ ] Test function invocation against production

---

## 13. STORAGE BUCKETS

| Bucket | Public | File Size Limit | Status |
|---|---|---|---|
| `profile-avatars` | ❌ Private | 2MB | ⚠️ Needs verification in production |
| `student-documents` | ❌ Private | 10MB | ⚠️ Needs verification in production |
| `mentor-resources` | ✅ Public | 50MB | ⚠️ Check RLS policies |
| `gallery-images` | ✅ Public | 10MB | ⚠️ Check RLS policies |
| `public-website` | ✅ Public | 10MB | ⚠️ Check RLS policies |
| `message-attachments` | ❌ Private | 10MB | ⚠️ Needs verification in production |
| `shared_files` | ❌ Private | 10MB | ⚠️ Needs verification in production |

**Action Items:**
- [ ] Create all 7 buckets in production Supabase
- [ ] Apply RLS policies to production storage buckets
- [ ] Verify upload/download permissions for each role

---

## 14. AUTH CONFIGURATION

| Setting | Value | Status | Recommendation |
|---|---|---|---|
| JWT expiry | 3600s (1 hour) | ⚠️ Short for production | Consider 7200s (2 hours) |
| Refresh token rotation | Enabled | ✅ Good | — |
| Refresh token reuse interval | 10s | ✅ Good | — |
| Session timebox | 24h | ⚠️ Short | Consider 7-14 days |
| Inactivity timeout | 2h | ⚠️ Short | Consider 24h |
| Email confirmations | Required | ✅ Good | — |
| Auto-confirm | Disabled | ✅ Good | — |
| Double confirm changes | Enabled | ✅ Good | — |
| MFA | **Disabled** | ❌ **Critical** | Should be enabled for production, at least for mentors |
| MFA max enrolled factors | 10 | N/A (MFA disabled) | — |
| Sign-up rate limit | 10/hour | ✅ Good | — |
| Sign-in rate limit | 30/hour | ⚠️ Low for production | Consider 60/hour |
| Token refresh rate limit | 30/hour | ✅ Good | — |

**Action Items:**
- [ ] Enable MFA for mentor and admin roles
- [ ] Consider increasing session timebox (24h → 7d)
- [ ] Adjust sign-in rate limit for production traffic
- [ ] Review and apply auth config to production Supabase project

---

## 15. GOOGLE CALENDAR INTEGRATION

| Check | Status | Details |
|---|---|---|
| OAuth 2.0 client configured | ⚠️ Warning | `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_SECRET` referenced in env files |
| Google Cloud Console project | ❌ Not verified | No evidence of project setup verification |
| Calendar API enabled | ❌ Not verified | Must be enabled in Google Cloud Console |
| OAuth consent screen published | ❌ Not verified | Must be configured and published |
| Redirect URIs configured | ❌ Not verified | Must include `https://mentorino.app` and staging equivalents |
| Refresh token handling | ⚠️ Not verified | Check if token refresh is implemented |

**Action Items:**
- [ ] Verify Google Cloud Console project exists and Calendar API is enabled
- [ ] Configure OAuth consent screen (production)
- [ ] Add redirect URIs for production domain
- [ ] Verify OAuth flow end-to-end against staging

---

## 16. GEMINI INTEGRATION

| Check | Status | Details |
|---|---|---|
| API key configured | ❌ Not for production | `GEMINI_API_KEY` set in staging only |
| Model | `gemini-2.0-flash` | ✅ Good — fast, cost-effective |
| Rate limiting | ✅ 30 requests/min | DB-backed via `rate_limits` table |
| PII stripping | ✅ Implemented | Email, phone, credit card patterns redacted |
| Streaming | ✅ Supported | SSE-based streaming for chat |
| Fallback behavior | ⚠️ Partial | Returns 503 if no API key; no model fallback if Gemini is down |

**Action Items:**
- [ ] Obtain production Gemini API key (enable billing in Google AI Studio)
- [ ] Set `GEMINI_API_KEY` in production Supabase secrets
- [ ] Consider implementing model fallback (e.g., Gemini 1.5 Flash if 2.0 unavailable)

---

## 17. RESEND INTEGRATION

| Check | Status | Details |
|---|---|---|
| API key configured | ❌ Not for production | `RESEND_API_KEY` set in staging only |
| Domain verified | ❌ Not verified | `mentorino.com` domain must be verified in Resend |
| Email templates | ✅ 4 templates | welcome, session_reminder, application_update, notification |
| HTML escaping | ✅ Implemented | `esc()` / `escapeHtml()` on all user content |
| Sender address | `notifications@mentorino.com` | ⚠️ Must be verified in Resend |
| Bounce handling | ⚠️ Not implemented | No webhook or bounce processing |

**Action Items:**
- [ ] Verify `mentorino.com` domain in Resend
- [ ] Configure Resend webhook for bounce/complaint handling
- [ ] Set `RESEND_API_KEY` in production Supabase secrets

---

## 18. VERCEL CONFIGURATION

| Check | Status | Details |
|---|---|---|
| `vercel.json` present | ✅ Yes | CSP, HSTS, cache headers configured |
| Build command | `npm run build` | ✅ Correct |
| Output directory | `dist` | ✅ Correct |
| Install command | `npm ci` | ✅ Correct |
| Framework | `vite` | ✅ Correct |
| Node version | `20.x` | ✅ Correct |
| SPA rewrites | ✅ Configured | All non-API routes → `index.html` |
| CSP headers | ✅ Strict | `default-src 'self'`, `script-src 'self'`, no `unsafe-eval` |
| HSTS | ✅ Enabled | `max-age=63072000; includeSubDomains; preload` |
| Permissions-Policy | ✅ Restricted | `camera=(), microphone=(), geolocation=()` |
| Vercel Analytics | ❌ Not configured | Not in `vercel.json` or code |
| Vercel Speed Insights | ❌ Not configured | Not in code |

**Action Items:**
- [ ] Enable Vercel Analytics (can be done in Vercel dashboard)
- [ ] Enable Vercel Speed Insights (add `@vercel/speed-insights` package)
- [ ] Configure Vercel custom domain (`mentorino.app`)
- [ ] Set environment variables in Vercel Project Settings

---

## 19. SUPABASE CONFIGURATION

| Check | Status | Details |
|---|---|---|
| Staging project | ✅ `mentarino-staging` (ref: `rpxcrgpxyuvhnhnopvpa`) | Fully configured and tested |
| Production project | ❌ **Not created** | No production Supabase project evidence |
| Production project ref | ❌ Unknown | Must create and link |
| Production database | ❌ Not provisioned | Must create, run migrations, seed data |
| Project settings aligned | ⚠️ Not verified | Must match staging config (auth, storage, etc.) |
| Connection pooling | ✅ `transaction` mode, pool 15-20 | Good for serverless |
| Database size | ⚠️ Unknown | Staging has minimal data — need capacity planning |

**Action Items:**
- [ ] Create production Supabase project
- [ ] Run all migrations against production database
- [ ] Run seed data for production (if needed)
- [ ] Link local project to production: `supabase link --project-ref <prod-ref>`
- [ ] Configure auth settings to match production needs (MFA, session timeouts)

---

## 20. MONITORING

| Check | Status | Details |
|---|---|---|
| Sentry error tracking | ⚠️ Partial | Initialized in code, DSN is placeholder — **will not work in production** |
| Health check endpoint | ✅ Built | `src/lib/healthCheck.ts` — checks DB, storage, auth, edge functions, realtime, email |
| Startup validation | ✅ Built | `src/lib/productionGuard.ts` — blocks startup if required env vars missing |
| Error handler | ✅ Built | `src/lib/errorHandler.ts` — user-friendly error messages, known error codes |
| PostHog analytics | ❌ Not configured | API key empty in all env files — **no analytics** |
| Vercel Analytics | ❌ Not configured | Not implemented |
| Vercel Speed Insights | ❌ Not configured | Not implemented |
| Console logging (edge functions) | ✅ `console.log`/`console.error` | Each function logs key events |
| Rate limit monitoring | ⚠️ Minimal | DB-backed rate limits exist; no alerting on rate limit hits |

**Action Items:**
- [ ] Create production Sentry project and replace DSN
- [ ] Configure PostHog project and set API key
- [ ] Enable Vercel Analytics (toggle in Vercel dashboard)
- [ ] Add uptime monitoring (e.g., UptimeRobot, Better Uptime) for `https://mentorino.app`
- [ ] Set up Sentry alerting rules for critical errors

---

## 21. LOGGING

| Check | Status | Details |
|---|---|---|
| Client-side logger | ✅ `src/lib/logger.ts` | Log levels (debug → critical), sensitive data redaction, sessionStorage error capture |
| Error capture | ✅ sessionStorage | Stores last 50 errors — accessible via `logger.getRecentErrors()` |
| Edge function logging | ✅ `console.log`/`console.error` | Each function logs start, success, failure, duration |
| Audit logging (provisioning) | ✅ `provisioning_audit_logs` table | Phase 3 state machine logs every step |
| Analytics events | ✅ `analytics_events` table | Student approval, session completion, goal creation |
| Log persistence | ⚠️ Client-side only (sessionStorage) | No server-side log aggregation; relies on Vercel/Supabase logs |

**Action Items:**
- [ ] Review Vercel Logs configuration to capture server-side function logs
- [ ] Configure log drain to external service if needed (e.g., Logtail, Axiom)

---

## 22. ANALYTICS

| Check | Status | Details |
|---|---|---|
| PostHog project | ❌ Not configured | `VITE_POSTHOG_API_KEY` and `VITE_POSTHOG_HOST` are empty |
| Analytics events (custom) | ✅ `analytics_events` table | Student approval, session completion, goal creation tracked in DB |
| Vercel Analytics | ❌ Not configured | Not linked |
| Dashboard/reporting | ⚠️ None for product analytics | BI dashboard exists in-app for mentors, but no product-level analytics |

**Action Items:**
- [ ] Set up PostHog project for product analytics
- [ ] Add key event tracking (sign-ups, logins, applications, sessions)
- [ ] Enable Vercel Analytics for web vitals

---

## 23. ERROR TRACKING

| Check | Status | Details |
|---|---|---|
| Sentry DSN (production) | ❌ **Placeholder** | `https://xxxxx@xxxxx.ingest.us.sentry.io/xxxxx` — **must replace** |
| Sentry init | ✅ `src/lib/sentry.ts` | Lazy-loaded, `tracesSampleRate: 0.1` |
| Source maps | ❌ Not configured | Build config needs to upload source maps to Sentry |
| Error boundary | ✅ `ErrorBoundary.tsx` | Catches render errors, provides UI feedback |
| Error handler | ✅ `errorHandler.ts` | Known error codes, user-friendly messages, categorized (network/permission/auth) |

**Action Items:**
- [ ] Create production Sentry project
- [ ] Replace DSN in `.env.production` and Vercel production env vars
- [ ] Configure source map upload in build step (requires Sentry CLI/webpack plugin)
- [ ] Verify error ingestion with a test error

---

## 24. ROLLBACK CAPABILITY

| Check | Status | Details |
|---|---|---|
| Git rollback | ✅ `git revert` | Full commit history available |
| Vercel instant rollback | ✅ Vercel supports | Deploy previous version with one click |
| Database rollback | ⚠️ Manual | No migration versioning system (no `supabase migration up/down` tracking applied); must run reverse SQL manually |
| Edge function rollback | ✅ `supabase functions deploy` previous version | Can redeploy previous version |
| Storage rollback | ⚠️ Manual | Storage objects would need manual restore |
| Auth rollback | ⚠️ Manual | Auth users created by edge functions — rollback exists for provisioning |
| Provisioning rollback | ✅ State machine | `executeRollback()` in approve-application — complete compensation logic |

**Rollback Procedure (in order):**

```bash
# 1. Vercel — instant rollback to previous deployment
   # Vercel Dashboard → Deployments → ... → Rollback to Stable

# 2. Git — revert problematic commit(s)
   git revert <bad-commit-hash>
   git push origin master

# 3. Database — apply reverse migration
   # Manually execute SQL to reverse the LAST applied migration
   # (No automated migration down tooling — must use manual SQL)

# 4. Edge Functions — redeploy previous version
   supabase functions deploy <function-name> --project-ref <prod-ref>

# 5. Verify health endpoint
   curl https://mentorino.app/api/health
```

---

## 25. PRE-FLIGHT CHECKLIST (DEPLOY DAY)

### T-24 Hours
- [ ] Create production Supabase project
- [ ] Run all migrations against production
- [ ] Create storage buckets with RLS policies in production
- [ ] Set production Supabase auth config
- [ ] Create production Sentry project, get DSN

### T-2 Hours
- [ ] Set all Vercel production environment variables
- [ ] Set all Supabase production edge function secrets
- [ ] Configure production domain in Vercel (`mentorino.app`)
- [ ] Set Vercel Analytics and Speed Insights
- [ ] Update `package.json` version to `1.0.0`
- [ ] Create and push `v1.0.0` git tag
- [ ] Create GitHub Release

### T-30 Minutes
- [ ] Push to production branch (trigger Vercel deploy)
- [ ] Run health check: `GET https://mentorino.app/api/health`
- [ ] Run E2E smoke tests against production
- [ ] Verify Sentry error ingestion
- [ ] Verify PostHog event ingestion

### T-5 Minutes
- [ ] Announce deployment window (internal)
- [ ] Verify DNS propagation for custom domain
- [ ] Monitor Vercel deployment logs

### T-0 (Launch)
- [ ] Confirm deployment complete
- [ ] Run full E2E test suite against production
- [ ] Verify user flows: auth → apply → approve → onboard → message
- [ ] Monitor error rates for first 15 minutes
- [ ] Announce launch

### Post-Launch (First 24 Hours)
- [ ] Monitor Sentry for new errors
- [ ] Monitor edge function performance
- [ ] Monitor email delivery
- [ ] Monitor database connection pool usage
- [ ] Review Vercel Analytics for traffic patterns
- [ ] Check rate limit thresholds
- [ ] Review analytics events for correctness

---

## 26. RISK REGISTER

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Production Supabase not yet created | High | Critical | Create before launch day | DevOps |
| R2 | Sentry DSN still placeholder at deploy | Medium | High | Add to pre-flight checklist as explicit GO/NO-GO gate | Release Manager |
| R3 | MFA disabled — account takeover risk | Medium | High | Enable MFA for mentor accounts before launch | DevOps |
| R4 | No production PostHog/project analytics | Medium | Medium | Deploy without analytics; add post-launch (acceptable for v1) | PM |
| R5 | CSP blocks legitimate 3rd party integration | Low | Medium | Review CSP against all external services | Sec |
| R6 | Rate limits too restrictive for production traffic | Medium | Medium | Monitor first week; adjust thresholds | DevOps |
| R7 | No production Supabase backup configured | High | Critical | Enable PITR (Point-in-Time Recovery) on production DB | DevOps |
| R8 | Email from unverified domain (mentorino.com) | High | Critical | Verify domain in Resend; use `mentorino.vercel.app` as fallback sender | DevOps |
| R9 | Vite `allowedHosts: ["all"]` allows host header injection | Medium | Medium | Remove `allowedHosts` or restrict to known domains before production deploy | Sec |
| R10 | Repository has keys committed in history | Medium | High | Run full git history scan; rotate any found keys | Sec |

---

## 27. GO/NO-GO GATES

### GATE 1: Production Infrastructure (24h before launch)
- [ ] Production Supabase project created and linked
- [ ] All migrations applied successfully
- [ ] All storage buckets created
- [ ] Auth configuration applied

**GO/NO-GO:** _________________

### GATE 2: Secrets & Configuration (2h before launch)
- [ ] Sentry DSN → real value
- [ ] Supabase credentials → real production values
- [ ] Edge function secrets → all 5 secrets set
- [ ] Vercel env vars → all set

**GO/NO-GO:** _________________

### GATE 3: Deployment Verification (30min before launch)
- [ ] Production build passes
- [ ] E2E tests pass against production
- [ ] Health check returns all green
- [ ] Sentry confirms error ingestion

**GO/NO-GO:** _________________

### GATE 4: Final Launch (T-0)
- [ ] Domain resolves correctly
- [ ] Core user flow works (unauthenticated)
- [ ] Auth flow works (sign-up, sign-in, password reset)
- [ ] Error rates at zero

**GO/NO-GO:** _________________

---

## 28. DECLARATION

I have reviewed all items in this checklist.

**Overall verdict:** ⚠️ **CONDITIONAL GO** — 6 critical items remain (5 infrastructure, 1 configuration). Deployment should proceed only after all critical items are resolved.

| Role | Name | Sign-off |
|---|---|---|
| Release Manager | | |
| Lead Developer | | |
| QA Lead | | |
| Product Owner | | |
| DevOps | | |

---

*Checklist generated by Production Release Manager — Mentorino v1.0.0*
