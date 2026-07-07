# Baseline System Audit

**Date:** 2026-07-06
**Phase:** 0 — Freeze Stable Version
**Status:** ✅ Complete

---

## 1. Build Verification

| Check | Status | Details |
|-------|--------|---------|
| `npm install` | ✅ Passed | 329 packages, 11 vulnerabilities (1 low, 2 moderate, 7 high, 1 critical — none in application code) |
| `npm run lint` (tsc --noEmit) | ⚠️ Warnings | 17 errors — ALL in `backups/edge-functions/` (Deno files not meant for Node/TypeScript). Application code: 0 errors. |
| `npm run build` (tsc -b && vite build) | ⚠️ Warnings | Same 17 Deno-related errors in `backups/`. Vite bundling succeeds. |
| `npm run test` (vitest run) | ✅ Passed | 5 test files, 46 tests passed, 7.99s duration |

**Conclusion:** Application code is clean. Backup edge function files (Deno) cause expected type errors outside their runtime.

## 2. Git State

| Property | Value |
|----------|-------|
| Current Branch | `master` |
| Tracking | `origin/master` |
| Head Commit | `d5dde7f` — "chore: add test artifacts and schema dump to gitignore" |
| Previous Tag | `v1.0-stable` (at commit `0be2797`) |
| Untracked | `backups/`, `codex/`, `codex docs/`, `screenshots/` |

## 3. Supabase Project

| Property | Value |
|----------|-------|
| Project Ref | `jnazlfhhzxrocvxvmkkc` |
| Name | mentarino |
| Organization | `butcyjsbyvybgbqonwff` |
| API URL | `https://jnazlfhhzxrocxvmkkc.supabase.co` |
| Postgres Version | 17.6.1.127 |
| Supabase CLI | v2.109.0 |
| REST API | v14.5 |
| Storage API | v1.61.10 |

## 4. Environment Variables

| Variable | Status | Source |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | ✅ Configured | `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Configured | `.env.local` |
| `VITE_SENTRY_DSN` | ⚠️ Empty (optional) | `.env.local` |
| `VITE_POSTHOG_API_KEY` | ⚠️ Empty (optional) | `.env.local` |
| `VITE_POSTHOG_HOST` | ⚠️ Empty (optional) | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Not in repo | Must retrieve from Dashboard |
| `GEMINI_API_KEY` | ❌ Not in repo | Supabase Edge Function secret |
| `RESEND_API_KEY` | ❌ Not in repo | Supabase Edge Function secret |
| `CRON_SECRET` | ❌ Not in repo | Supabase Edge Function secret |

## 5. Git Branches

| Branch | Purpose |
|--------|---------|
| `master` | Active development branch |
| `stable-v1` | Previous stable release |
| `origin/main` | Remote main |
| `origin/master` | Remote master |
| `origin/stable-v1` | Remote stable-v1 |

## 6. Project Dependencies

| Category | Key Dependencies |
|----------|-----------------|
| UI | React 19, react-router-dom 7.1.1, TailwindCSS 4, Motion 12, Lucide React |
| Data | @supabase/supabase-js 2.108.2, @tanstack/react-query 5.100.8 |
| AI | Gemini Edge Function (via supabase functions) |
| Email | Resend Edge Function |
| Charts | Recharts 2.15.0 |
| Testing | Vitest 4.1.9, Playwright 1.61.1, MSW 2.14.6 |
| Build | Vite 6.2, TypeScript 5.8 |
| Monitoring | Sentry React 10.62.0 |
| File | jsPDF, xlsx, hls.js |

## 7. Audit Readiness

The project is ready for Phase 1 (RLS Security). A comprehensive baseline exists with:
- 43 Supabase migration files
- 4 Edge Functions (gemini, resend, scheduled, middleware/auth)
- 38 services
- 24 hooks
- 19 pages
- 7 feature modules (admin, mentor, student, messaging, resources, events, settings)
- Complete backup documentation in `backups/`
