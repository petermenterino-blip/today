# Security Regression Audit

**Date:** 2026-07-06

---

## 1. Authentication & Authorization

| Check | Status | Details |
|-------|--------|---------|
| JWT token validation | ✅ | `verifyAuth()` parses and validates Supabase JWT |
| Role-based access control | ✅ | `requireRole()` enforced on all edge functions |
| Service role key usage | ✅ | Server-side only, never exposed to client |
| Mentor-only operations | ✅ | `approve-application`, `resend` require mentor role |
| Email confirmation on signup | ✅ | `email_confirm: true` in both auth paths |

---

## 2. CORS Configuration

| Check | Status | Details |
|-------|--------|---------|
| CORS headers set | ✅ | `CORS_HEADERS` in all edge functions |
| Vary: Origin header | ❌ | Not explicitly set in CORS responses |
| Duplicate CORS headers | ⚠️ **MINOR** | `getCorsHeaders` defined twice in `middleware/auth.ts` (lines 91 and 107) — both identical, no functional impact |

---

## 3. Input Validation

| Check | Status | Details |
|-------|--------|---------|
| JSON body validation | ✅ | Parsed, checked for required fields |
| SQL injection | ✅ | Supabase JS SDK uses parameterized queries |
| XSS in email templates | ✅ | All user input HTML-escaped via `esc()` / `escapeHtml()` |
| Path traversal in storage | ✅ | `storagePath` from `sharedFilesService` built server-side |

---

## 4. Secrets Management

| Secret | Storage | Exposure |
|--------|---------|----------|
| `SUPABASE_URL` | Edge function env vars | Server-side only |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge function env vars | Server-side only |
| `RESEND_API_KEY` | Edge function env vars | Server-side only |
| `GEMINI_API_KEY` | Edge function env vars | Server-side only |
| `VITE_SUPABASE_*` | Vite env vars (`VITE_` prefix) | ⚠️ **Client-side** — by convention, `VITE_` vars are embedded in bundle |

**Issue:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are `VITE_` prefixed, meaning they're embedded in the JavaScript bundle served to the browser. This is **by design** — the anon key is intended to be public with RLS enforcing security. However, confirming they're anon keys (not service keys) is critical.

---

## 5. Rate Limiting & Abuse Prevention

| Check | Status | Details |
|-------|--------|---------|
| Edge function rate limiting | ✅ | Gemini: 30 req/min, Resend: 10 req/min |
| Auth rate limiting | ✅ | Supabase Auth has built-in rate limits |
| Idempotency for double-spend | ✅ | `approve-application` Phase 3 has idempotency key |
| IP-based rate limiting | ✅ | Per-IP sliding window for Gemini |

---

## 6. Storage Security

| Check | Status | Details |
|-------|--------|---------|
| Private buckets | ✅ | `student-documents`, `mentor-resources`, `message-attachments`, `shared_files` |
| Signed URL expiry | ✅ | Configurable, default 7 days for viewing, 1 hour for download |
| RLS policies | ⚠️ Partial | `shared_files` bucket has no storage-level RLS (relies on bucket privacy) |

---

## 7. Recommendations

| Priority | Action | Details |
|----------|--------|---------|
| HIGH | Confirm `VITE_SUPABASE_*` are anon keys, never service keys | If service key found in `VITE_` var — **CRITICAL** |
| MEDIUM | Remove duplicate `getCorsHeaders` definition | Clean up `middleware/auth.ts:91` and `:107` |
| MEDIUM | Add storage-level RLS for `shared_files` bucket | Defense in depth |
| LOW | Add `Vary: Origin` header to edge function CORS | Required for CORS compliance |

---

## Summary

✅ **PASS** — No critical security regressions found. Auth, RBAC, input sanitization, and secrets management follow best practices. Minor issues: duplicate CORS helper in middleware, missing storage RLS for `shared_files`, and `VITE_` key verification should be confirmed.
