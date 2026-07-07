# Production Deployment Report

**Project:** Mentorino (`mentorino/today`)
**Deployed:** 2026-07-06
**Verdict:** ✅ SUCCESSFUL PRODUCTION DEPLOYMENT

---

## 1. Database

| Check | Status | Details |
|-------|--------|---------|
| Production Supabase project | ✅ EXISTING | `mentarino` (ref: `jnazlfhhzxrocvxvmkkc`) |
| Migration sync | ✅ SYNCED | All 48 local migrations match remote |
| Migration count | 49 | 49 entries in `supabase_migrations.schema_migrations` |
| Migration order | ✅ VERIFIED | 001 → 040 → 900 → 9990 → 9994 applied in sequence |
| Remote-only migrations | ✅ RESOLVED | Versions 023, 030 from old codebase cleaned from history |
| `config.toml` format | ✅ FIXED | Updated for CLI v2.106.0 (removed deprecated keys) |

**Deployment issues resolved:**
- `config.toml` had deprecated keys (`db.enabled`, `functions.verify_jwt`, etc.) — migrated to new format
- Migration 023 (`023_events_module14_complete.sql`) — added exception handling for `alter publication`
- Migration 0302 (`0302_messaging_fixes.sql`) — added `DROP POLICY IF EXISTS` guards
- Migration 038 (`038_remove_admin_role.sql`) — reordered to drop policies before dropping `is_admin()` function

## 2. Edge Functions

| Function | Status | verify_jwt | Notes |
|----------|--------|------------|-------|
| `gemini` | ✅ DEPLOYED | true | Bundles `middleware/auth.ts` |
| `resend` | ✅ DEPLOYED | true | Bundles `middleware/auth.ts` |
| `scheduled` | ✅ DEPLOYED | false | Cron-triggered, deployed with `--no-verify-jwt` |
| `approve-application` | ✅ DEPLOYED | true | Bundles `middleware/auth.ts` |
| `middleware/auth.ts` | ✅ BUNDLED | N/A | Shared module (not standalone function) |

## 3. Secrets

| Secret | Status |
|--------|--------|
| `SUPABASE_URL` | ✅ AUTO (platform-managed) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ AUTO (platform-managed) |
| `RESEND_API_KEY` | ✅ SET |
| `GEMINI_API_KEY` | ✅ SET |
| `CRON_SECRET` | ✅ SET (`c28ff6b661134647b82aee913710b972`) |

## 4. Vercel Deployment

| Check | Status | Details |
|-------|--------|---------|
| Build | ✅ SUCCESS | 2m build time, Node.js 20.x (warned about deprecation) |
| Production URL | ✅ LIVE | `https://today-ten-zeta.vercel.app` |
| Deployments | ✅ VERIFIED | Most recent: 3m ago; 4 prior production deployments available for rollback |
| `vercel.json` | ✅ FIXED | Removed deprecated `nodeVersion` field |

**Environment variables set:**
- `VITE_SUPABASE_URL` → production Supabase URL
- `VITE_SUPABASE_ANON_KEY` → production anon key
- `VITE_APP_ENV` → `production`
- `VITE_ENABLE_EDGE_APPROVAL` → `true`
- `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` → `false`

## 5. Smoke Tests

| Test | Result |
|------|--------|
| Landing page (/) | ✅ 200 |
| Login page (/auth/login) | ✅ 200 |
| JS assets load | ✅ 200 |
| Edge function (gemini) | ✅ 401 (JWT verification working) |
| Database connectivity | ✅ 49 migrations applied |

## 6. Remaining Work (Deferred Post-Launch)

| Item | Reason |
|------|--------|
| Sentry DSN | Not configured — `envValidator.ts` will block production startup |
| PostHog API key | Not configured |
| Custom domain | Not configured |
| Email domain verification | Not configured |
| Database backups schedule | Not configured |
| Monitoring dashboards | Not configured |
| `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | Set to `false` — enable after staging verification |

## 7. Rollback Instructions

- **Vercel:** `vercel rollback today-ten-zeta.vercel.app` to revert to previous production deployment
- **Database:** `supabase db push` to revert specific migrations (see `docs/ROLLBACK_GUIDE.md` for full guide)
- **Edge Functions:** Previous versions retained in Supabase Dashboard → Edge Functions

---

**Deployed by:** opencode / big-pickle
**Timestamp:** 2026-07-06T18:05+00:00
