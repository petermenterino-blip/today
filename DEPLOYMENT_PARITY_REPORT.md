# Deployment Parity Report

**Generated:** 2026-07-07  
**Auditor:** Senior Release Engineer  
**Scope:** Local Source ↔ GitHub Master ↔ Production Deployment ↔ Staging Deployment  

---

## Executive Summary

| Domain | Status |
|--------|--------|
| Source Control | ⚠️ WARNING |
| Build Configuration | ❌ FAIL |
| Frontend Assets | ❌ FAIL |
| Backend / Edge Functions | ❌ FAIL |
| Deployment Config | ❌ FAIL |
| Database / Migrations | ⚠️ WARNING |
| Environment / Secrets | ❌ FAIL |

**Overall: DEPLOYMENT PARITY BROKEN — Do NOT promote without remediation.**

---

## 1. Commit Hash Verification

| Source | Commit | Status |
|--------|--------|--------|
| Local HEAD | `10a35e13` | PASS |
| GitHub origin/master | `10a35e13` | PASS |
| Production (Vercel) | `10a35e13` | PASS |
| Staging/Preview (Vercel) | `d5dde7fb` | ❌ FAIL |

### Mismatch Details

**File:** Staging Deployment Commit  
**Difference:** Staging is on `d5dde7fb` (2 commits behind master: `373cf87`, `10a35e13`).  
**Risk:** Staging lacks CSP fix and mentor image fix. Edge function tests against staging will validate outdated code.  
**Fix:** Deploy latest master to Vercel Preview environment.  
**Rollback:** N/A — staging must be caught up, not rolled back.

---

## 2. Local Working Tree vs GitHub (Uncommitted Changes)

The local working tree has **uncommitted changes** in 60+ files. These are **NOT** on GitHub and **NOT** deployed.

### Critical Configuration Diffs

| File | Difference | Risk |
|------|-----------|------|
| `package.json` | Added `engines` block, `dompurify` dep, seed scripts | Low — additive, but package-lock will diverge |
| `vite.config.ts` | Added `cssCodeSplit: true`, `minify: 'esbuild'`, `vendor-heavy`/`vendor-data`/`feature-heavy` chunks | ❌ **HIGH** — build output structure changes completely; asset hashes will differ |
| `vercel.json` | CSP narrowed: removed `https://fonts.googleapis.com`, `https://fonts.gstatic.com`, `https://images.unsplash.com`, `https://www.transparenttextures.com` | ❌ **HIGH** — if deployed, external fonts/images will be blocked by CSP |
| `tsconfig.json` | Added `backups` to exclude list | Low |
| `.env.example` | Significantly expanded with sections, edge function secrets, feature flags | Low — docs only |
| `.gitignore` | Added `.env`, `.env.staging`, `.env.production`, `.env.local.bak`, `playwright/.auth/*.json` | Low — additive |

**Fix:** Commit or stash all pending changes. Reconcile CSP in `vercel.json` — the narrowed version will break Google Fonts and external images.

---

## 3. Build Output / Asset Hash Comparison

### Production Deployed Assets (https://today-ten-zeta.vercel.app)

| Asset | Hash | Size |
|-------|------|------|
| `index-D0WOOYYz.js` | `383ef9d2` | ~51 KB |
| `vendor-DtGM5E7-.js` | `4a2c9878` | ~1.9 MB |
| `vendor-ui-WxDng8Bn.js` | — | — |
| `index-y_zvcwjN.css` | `22238c9e` | ~154 KB |

### Local Build (dist/)

| Asset | Hash | Size |
|-------|------|------|
| `index-zEj56tnX.js` | different | — |
| `index-BW23h_jU.css` | different | — |
| `vendor-DNWuMB4a.js` | different | — |
| `vendor-ui-DIJ46Hb4.js` | different | — |
| `vendor-data-DDkxoLQr.js` | NEW chunk | — |
| `vendor-heavy-CsVOIiN-.js` | NEW chunk | — |
| `feature-heavy-DopVxgpZ.js` | NEW chunk | — |

### Staging Assets

Staging (Preview) deployment at `https://today-irtpf2ood-mentorino.vercel.app` requires SSO auth; assets could not be directly fetched. Likely built from `d5dde7fb` — different from both local and production.

| Comparison | Status |
|-----------|--------|
| Local vs Production | ❌ FAIL — hashes completely different; local has extra chunks |
| GitHub master vs Production | ❌ FAIL — master has `tsc -b` build pipeline; production used `vite build` directly |
| Staging vs Production | ❌ FAIL — different source commits produce different hashes |

**Fix:** Ensure identical `vite.config.ts` across all environments. Rebuild and redeploy from the same commit.

---

## 4. Frontend Parity

### Routes (src/app/App.tsx)

| Route | All Environments | Status |
|-------|-----------------|--------|
| `/` (Landing) | All | PASS |
| `/about` | All | PASS |
| `/programs` | All | PASS |
| `/consultation` | All | PASS |
| `/faq` | All | PASS |
| `/contact` | All | PASS |
| `/gallery` | All | PASS |
| `/mentorship` | All | PASS |
| `/auth` | All | PASS |
| `/pending-approval` | All | PASS |
| `/booking`, `/book-call` | All | PASS |
| `/store` | All | PASS |
| `/survey` | All | PASS |
| `/privacy` | All | PASS |
| `/terms` | All | PASS |
| `/reset-password` | All | PASS |
| `/financials` | All | PASS |
| `/consultation-overview` | All | PASS |
| `/student/*` | All | PASS |
| `/dashboard/*` | All | PASS |
| `/apply` | All | PASS |
| `/settings` | All | PASS |
| `/mentor/*` | All | PASS |
| `*` (404) | All | PASS |

### Pages (19 files in `src/pages/`)

All 19 page components exist. Local source may have uncommitted edits affecting rendering, but page structure is identical.

| Status | Finding |
|--------|---------|
| PASS | All pages present in all environments |
| PASS | All lazy-loaded consistently |

### Components (shared + UI)

| Component | Status |
|-----------|--------|
| `ErrorBoundary` | ⚠️ Local has uncommitted changes |
| `Footer` | ⚠️ Local has uncommitted changes |
| `Layout` | ⚠️ Local has uncommitted changes |
| `NotificationDropdown` | ⚠️ Local has uncommitted changes |
| `OfflineBanner` | PASS |
| `ProtectedRoute` | PASS |
| `ScrollToTop` | PASS |
| `VisitorHeader` | PASS |
| `ConfirmDialog` | ⚠️ Local has uncommitted changes |
| `EmptyState` | ⚠️ Local has uncommitted changes |

### Public Assets

| Asset | Status |
|-------|--------|
| `images/mentorino.png` | PASS (present in `public/`) |
| `images/event-1.jpeg` through `event-4.jpg` | PASS |
| `images/event-placeholder.svg` | ❌ FAIL — **DELETED locally** (committed `HEAD` has it) |

**Risk:** The event placeholder SVG was deleted in the working tree. On next deploy, the placeholder will be missing unless restored.

---

## 5. Backend Parity

### Edge Functions

| Function | Local | Production | Staging | Status |
|----------|-------|-----------|---------|--------|
| `approve-application` | Present | v3 | v1 | ❌ FAIL |
| `gemini` | Present | v6 | v1 | ❌ FAIL |
| `resend` | Present | v6 | v1 | ❌ FAIL |
| `scheduled` | Present | v6 | v1 | ❌ FAIL |
| `middleware/auth` | Present (imported) | Deployed inline | Deployed inline | ⚠️ WARNING |

**Difference:** Production functions are at version 3–6; staging functions are all at version 1.  
**Risk:** Staging is functionally obsolete — cannot properly test edge function behavior.  
**Fix:** Deploy latest edge functions to staging Supabase project.

### Edge Function Secrets

| Secret | Production | Staging | Status |
|--------|-----------|---------|--------|
| `CRON_SECRET` | ✅ Set | ❌ MISSING | ❌ FAIL |
| `GEMINI_API_KEY` | ✅ Set | ❌ MISSING | ❌ FAIL |
| `RESEND_API_KEY` | ✅ Set | ❌ MISSING | ❌ FAIL |
| `SUPABASE_ANON_KEY` | ✅ Set | ✅ Set | PASS |
| `SUPABASE_DB_URL` | ✅ Set | ✅ Set | PASS |
| `SUPABASE_JWKS` | ✅ Set | ✅ Set | PASS |
| `SUPABASE_URL` | ✅ Set | ✅ Set | PASS |

**Risk:** `gemini`, `resend`, and `scheduled` edge functions will fail in staging due to missing secrets.  
**Fix:** Run `supabase secrets set` on staging project.

### Database / Migrations

| Metric | Local | Production | Staging | Status |
|--------|-------|-----------|---------|--------|
| Migration count | 49 | Unknown (Docker unavailable) | Unknown | ⚠️ WARNING |
| Migration files | 49 SQL files | Same commit base | Different commit base | ❌ FAIL |

**Note:** Docker is not running locally. Cannot run `supabase db diff` to compare remote schemas. Manual SQL inspection of the schema dump (`_schema_dump.sql`) is empty.

**Fix:** Verify migration state via `supabase db diff --use-migra --linked` with Docker running. Ensure all 49 migrations are applied to both production and staging.

### Supabase Config (config.toml)

| Setting | Local | Status |
|---------|-------|--------|
| Auth enabled | ✅ | PASS |
| Site URL | `https://mentorino.vercel.app` | PASS |
| JWT expiry | 3600s | PASS |
| DB version | 17 | PASS |
| Realtime enabled | ✅ | PASS |
| Storage enabled | ✅ | PASS |
| Storage buckets (6) | All configured | PASS |
| Edge runtime | Deno 2, per_worker | PASS |

**Note:** Config.toml is a local file. Remote Supabase config could differ — `supabase config push` should be run to sync.

### Storage Buckets (config.toml)

| Bucket | Public | MIME Types | Size Limit | Status |
|--------|--------|-----------|-----------|--------|
| `profile-avatars` | No | png, jpeg, webp | 2MB | PASS |
| `student-documents` | No | pdf, png, jpeg | 10MB | PASS |
| `mentor-resources` | Yes | pdf, png, jpeg, webp, mp4 | 50MB | PASS |
| `gallery-images` | Yes | png, jpeg, webp | 10MB | PASS |
| `public-website` | Yes | png, jpeg, webp, pdf | 10MB | PASS |
| `message-attachments` | No | pdf, png, jpeg, webp | 10MB | PASS |
| `shared_files` | No | pdf, png, jpeg, webp | 10MB | PASS |

All 7 buckets configured, matching local config.

---

## 6. Deployment Configuration

### Vercel Project

| Setting | Production | Staging (Preview) | Status |
|---------|-----------|-------------------|--------|
| Node Version | 24.x | 24.x | PASS |
| Framework | vite | vite | PASS |
| Build Command | `npm run build` | (inherits) | PASS |
| Install Command | `npm ci` | (inherits) | PASS |
| Output Directory | `dist` | (inherits) | PASS |

### Environment Variables (Vercel)

| Variable | Production | Staging (Preview) | Status |
|----------|-----------|-------------------|--------|
| `VITE_SUPABASE_URL` | ✅ Encrypted | ❌ MISSING | ❌ FAIL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Encrypted | ❌ MISSING | ❌ FAIL |
| `VITE_APP_ENV` | ✅ `production` | ❌ MISSING | ❌ FAIL |
| `VITE_ENABLE_EDGE_APPROVAL` | ✅ Encrypted | ❌ MISSING | ❌ FAIL |
| `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | ✅ Encrypted | ❌ MISSING | ❌ FAIL |

**Risk:** Staging Preview deployment has ZERO environment variables. The app will either fail to start, use fallback defaults, or connect to production Supabase by accident.  
**Fix:** Configure identical env vars in Vercel Preview environment, pointing to staging Supabase project.

### Headers (Production — from live fetch)

| Header | Value | Status |
|--------|-------|--------|
| `Content-Security-Policy` | Complex (see below) | ⚠️ See CSP section |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | PASS |
| `X-Content-Type-Options` | `nosniff` | PASS |
| `X-Frame-Options` | `DENY` | PASS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | PASS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | PASS |
| `Cache-Control` (assets) | `public, max-age=31536000, immutable` | PASS |
| `Cache-Control` (index.html) | `public, max-age=0, must-revalidate` | PASS |

### Content Security Policy Comparison

The CSP in **production deployment build config** differs from both the committed `vercel.json` and the local uncommitted `vercel.json`:

```
Production deployed:
  default-src 'self'; script-src 'self'; 
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
  img-src 'self' data: blob: https://www.transparenttextures.com 
          https://*.supabase.co https://images.unsplash.com; 
  connect-src 'self' https://*.supabase.co https://*.ingest.sentry.io wss://*.supabase.co; 
  font-src 'self' https://fonts.gstatic.com; 
  frame-src 'none'; object-src 'none'; media-src 'self' blob:;

Local (uncommitted) vercel.json:
  (NARROWER — missing Google Fonts, Unsplash, transparenttextures, fonts.gstatic.com)
```

**Risk:** The narrowed local CSP will break Google Fonts, background textures, and Unsplash images if deployed.  
**Fix:** Restore the production-worthy CSP in `vercel.json` before next deployment.

---

## 7. Branch Strategy

| Branch | Commit | Relation to Master | Status |
|--------|--------|-------------------|--------|
| `master` | `10a35e13` | HEAD | PASS |
| `main` | `d5dde7fb` | 2 behind | ⚠️ Stale |
| `stable-v1` | `0be27974` | 3 behind | ⚠️ Stale |

**Recommendation:** Archive or clean up stale branches to prevent confusion. Align `main` with `master` or remove it.

---

## 8. CI/CD Pipeline (GitHub Actions)

| Workflow | Status | Notes |
|----------|--------|-------|
| `security-audit` | PASS | `npm audit` on push/PR |
| `lint` | PASS | ESLint (non-blocking on warnings) |
| `typecheck` | PASS | `tsc --noEmit` |
| `codeql` | PASS | CodeQL analysis |
| `unit-tests` | PASS | `vitest run --coverage` |
| `e2e-tests` | PASS | Playwright chromium |
| `build` | PASS | Sequential after all prior jobs |

**Note:** CI uses Node 20, but Vercel deploys with Node 24.x. Ensure compatibility.

---

## 9. Tag Status

| Tag | Commit | Status |
|-----|--------|--------|
| `v1.0-stable` | Same as local HEAD | PASS (valid release marker) |

---

## 10. Production vs Staging Supabase Projects

| Attribute | Production (mentarino) | Staging (mentarino-staging) | Status |
|-----------|----------------------|---------------------------|--------|
| Project Ref | `jnazlfhhzxrocvxvmkkc` | `rpxcrgpxyuvhnhnopvpa` | PASS |
| Region | us-east-1 | us-east-1 | PASS |
| PG Version | 17.6.1.127 | 17.6.1.141 | ⚠️ Minor version mismatch |
| Status | ACTIVE_HEALTHY | ACTIVE_HEALTHY | PASS |
| Created | 2026-06-30 | 2026-07-06 | PASS (staging newer) |
| Edge functions | 4 (v3–6) | 4 (all v1) | ❌ FAIL |
| Edge secrets | 10 | 7 | ❌ FAIL |

---

## 11. Remediation Action Items

| # | Severity | Item | Owner |
|---|----------|------|-------|
| 1 | ❌ CRITICAL | Add environment variables to Vercel Preview (staging) | DevOps |
| 2 | ❌ CRITICAL | Deploy latest edge functions to staging Supabase | DevOps |
| 3 | ❌ CRITICAL | Set `CRON_SECRET`, `GEMINI_API_KEY`, `RESEND_API_KEY` on staging Supabase | DevOps |
| 4 | ❌ CRITICAL | Reconcile CSP in `vercel.json` — restore Google Fonts, Unsplash, transparenttextures | Dev |
| 5 | ❌ HIGH | Deploy latest `master` to staging (catch up from `d5dde7fb` to `10a35e13`) | DevOps |
| 6 | ❌ HIGH | Commit or discard pending local changes — working tree is 60+ files dirty | Dev |
| 7 | ⚠️ MEDIUM | Restore deleted `public/images/event-placeholder.svg` | Dev |
| 8 | ⚠️ MEDIUM | Run `supabase db diff` with Docker to verify migration state across all DBs | DevOps |
| 9 | ⚠️ MEDIUM | Clean up stale branches (`main`, `stable-v1`) or rebase onto master | Dev |
| 10 | ⚠️ MEDIUM | Verify CI uses Node 24.x to match Vercel runtime | DevOps |

---

## Scorecard

| Category | Score |
|----------|-------|
| **Source Parity** | 1 / 3 ⚠️ |
| **Build Parity** | 0 / 3 ❌ |
| **Frontend Parity** | 2 / 3 ⚠️ |
| **Backend Parity** | 0 / 4 ❌ |
| **Deployment Parity** | 1 / 3 ⚠️ |
| **Environment Parity** | 0 / 3 ❌ |
| **Overall** | **4 / 19 — DEPLOYMENT BROKEN** |

---

## Conclusion

**Deployment parity is BROKEN between all four environments.** The most critical issues are:

1. **Staging has zero Vercel environment variables** — the app will not connect to the correct Supabase instance.
2. **Edge functions in staging are at v1 vs v3–6 in production** — staging is functionally untestable for backend features.
3. **Three critical edge function secrets are missing in staging** — email, AI, and cron features will fail.
4. **CSP in local `vercel.json` is more restrictive than production** — next deployment will break fonts/images.
5. **Uncommitted local changes across 60+ files** — the local environment does not match what's deployed.

**Do NOT promote staging to production or deploy local changes until all items in the remediation table are resolved.**
