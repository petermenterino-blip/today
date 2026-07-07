# Environment Security Report

**Date:** 2026-07-06  
**Auditor:** Principal Security Engineer  
**Scope:** Environment variables, secrets exposure, service key leaks, build-time security

---

## 1. VITE_SUPABASE_URL Verification

| Check | Status | Details |
|-------|--------|---------|
| Uses `import.meta.env.VITE_SUPABASE_URL` in `supabase.ts:3` | ✅ PASS | Standard Vite pattern |
| Fallback to localhost when missing | ⚠️ WARN | `supabaseUrl \|\| 'http://localhost:54321'` at line 14 — dev safety net, but could mask missing config in prod |
| Value in `.env` | ✅ PASS | `http://localhost:54321` (safe placeholder) |
| Value in `.env.example` | ✅ PASS | `your_supabase_project_url` (placeholder) |
| Production build env required | ⚠️ ACTION | Must set `VITE_SUPABASE_URL` during CI/CD build — unset var silently falls back to localhost |

**Verdict:** ✅ PASS — No service key exposure. Fallback is acceptable for dev. Production build pipeline must set this var.

---

## 2. VITE_SUPABASE_ANON_KEY Verification

| Check | Status | Details |
|-------|--------|---------|
| Uses `import.meta.env.VITE_SUPABASE_ANON_KEY` in `supabase.ts:4` | ✅ PASS | Anon key as intended |
| Fallback to placeholder when missing | ⚠️ WARN | `anonKey \|\| 'placeholder-key'` at line 15 — dev safety net |
| Value in `.env` | ✅ PASS | `placeholder-for-CI` (CI-safe placeholder) |
| Value in `.env.example` | ✅ PASS | `your_supabase_anon_key` (placeholder) |

**Verdict:** ✅ PASS — Anon key is public-by-design. Supabase RLS enforces access control. No secrets exposed.

---

## 3. Service Role Key Leak Check

| Location | Search Pattern | Status |
|----------|---------------|--------|
| `src/` directory | `SUPABASE_SERVICE_ROLE_KEY` | ✅ Only in test fixtures + `envValidator.ts` (edge function validation, not client code) |
| `src/` directory | `VITE_SUPABASE_SERVICE_R` | ✅ No matches — no VITE_-prefixed service key |
| `src/` directory | `service_role` | ✅ Only in `logger.ts` redaction list (prevents logging) |
| `src/lib/supabase.ts` | Any `service` key reference | ✅ Not present |
| `supabase/functions/` | Usage of `SUPABASE_SERVICE_ROLE_KEY` | ✅ Server-side only (Deno) |

**Verdict:** ✅ PASS — No service role key leaks into client bundle. All service key usage is in:
- Edge functions (server-side Deno, uses `Deno.env.get()`)
- Test fixtures (test environment only)
- `envValidator.ts` (validates edge function env, never reaches client)
- `logger.ts` redaction list (prevents accidental logging)

---

## 4. SUPABASE_SERVICE_ROLE_KEY Usage Audit

| File | Line | Context | Safe? |
|------|------|---------|-------|
| `src/lib/envValidator.ts` | 116 | `requiredEdgeVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']` — validates edge function environment | ✅ Deno-only context |
| `src/lib/logger.ts` | 9 | In redaction pattern list: `'service_role_key'` | ✅ Prevents logging |
| `supabase/functions/*/index.ts` | various | `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` | ✅ Server-side |
| `.env.example` | 10 | `SUPABASE_SERVICE_ROLE_KEY=` (no `VITE_` prefix) | ✅ Correct — not exposed to client |

**Verdict:** ✅ PASS — All service key references are properly isolated to server-side contexts.

---

## 5. Feature Flags & Exposed Config

| Variable | Client-visible? | Purpose | Status |
|----------|----------------|---------|--------|
| `VITE_ENABLE_EDGE_APPROVAL` | ✅ Yes (VITE_ prefix) | Toggle edge function approval path | ✅ Intentional |
| `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | ✅ Yes (VITE_ prefix) | Toggle state machine provisioning | ✅ Intentional |
| `VITE_APP_ENV` | ✅ Yes (VITE_ prefix) | Environment label | ✅ Intentional |
| `VITE_SENTRY_DSN` | ✅ Yes (VITE_ prefix) | Sentry error reporting | ⚠️ DSN is public-by-design for Sentry |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No (no VITE_ prefix) | Admin database access | ✅ Properly isolated |

---

## 6. Resend Sender Verification

| Check | Status | Details |
|-------|--------|---------|
| Sender email | ✅ Hardcoded | `notifications@mentorino.com` in resend/index.ts:15 and approve-application/index.ts:336,743 |
| Domain ownership | ⚠️ UNKNOWN | Must verify `mentorino.com` in Resend dashboard |
| SPF record | ⚠️ UNKNOWN | DNS TXT record needed: `v=spf1 include:spf.resend.com ~all` |
| DKIM signing | ⚠️ UNKNOWN | DNS CNAME records from Resend dashboard |
| DMARC policy | ⚠️ UNKNOWN | DNS TXT record recommended: `v=DMARC1; p=quarantine;` |
| Domain in Resend | ⚠️ UNKNOWN | Must add `notifications@mentorino.com` as a sending domain |

**Verdict:** ⚠️ ACTION REQUIRED — Cannot verify programmatically from code alone. Requires Resend dashboard + DNS changes.

### DNS Records Needed
```
Type  Name                            Value
TXT   mentorino.com                   v=spf1 include:spf.resend.com ~all
CNAME resend._domainkey.mentorino.com  (value from Resend dashboard)
TXT   _dmarc.mentorino.com            v=DMARC1; p=quarantine; rua=mailto:dmarc@mentorino.com
```

---

## 7. Build-Time Security

| Check | Status | Details |
|-------|--------|---------|
| Vite inlines `VITE_*` vars at build time | ✅ | Env vars are embedded in JS bundle |
| No server-side keys in bundle | ✅ Verified | Grep confirms no `service_role` in client code |
| `.env` not committed to git | ✅ | Listed in `.gitignore` (standard) |
| `.env.local` not committed | ✅ | Listed in `.gitignore` |
| `.env.example` safe for commit | ✅ | Contains only placeholder values |

---

## 8. Recommendations

| Priority | Action | Owner | Details |
|----------|--------|-------|---------|
| HIGH | Verify Resend domain + configure SPF/DKIM/DMARC | DevOps | Required before production emails work reliably |
| MEDIUM | Add production env var check to build CI | DevOps | Build must fail if `VITE_SUPABASE_URL` is missing |
| LOW | Replace localhost fallback with build-time validation | Dev | Consider `if (import.meta.env.PROD && !supabaseUrl) throw Error(...)` |

---

## Summary

```
╔══════════════════════════════════════════════════════════════╗
║  ENVIRONMENT SECURITY: ✅ PASS                              ║
║                                                             ║
║  No service key exposure in client code.                    ║
║  All VITE_* vars are anon/public-by-design.                 ║
║  Resend domain verification is the only blocker.            ║
╚══════════════════════════════════════════════════════════════╝
```

**Fixes Applied During Hardening:**
1. **Removed `ensureBucket()`** from `sharedFilesService.ts` — bucket confirmed in migration `020_module6_complete.sql`. Runtime `ensureBucket()` would FAIL in production because anon key lacks `createBucket` permission.
2. **Removed unused `AuthProvider` import** from `App.tsx:4` — was causing lint confusion.
3. **Removed unused `storageService` import** from `sharedFilesService.ts:2` — dead import.
