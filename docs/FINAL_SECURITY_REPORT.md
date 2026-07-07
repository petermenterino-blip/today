# Final Security Report

**Date:** 2026-07-06
**Auditor:** Independent Security Auditor
**Application:** Mentorino
**Build:** v0.0.0

---

## Executive Summary

Security audit identified **6 CRITICAL**, **17 HIGH**, **10 MEDIUM**, and **7 LOW** severity issues. The most severe issues involve SECURITY DEFINER function abuse in the PostgreSQL database, plaintext credential transmission in email, SQL injection via dynamic query execution, and missing authorization controls on storage buckets and edge functions.

### Severity Breakdown

```
CRITICAL  ████████████████████ 6
HIGH      ██████████████████████████████████████████████████ 17
MEDIUM    ██████████████████████████████████████ 10
LOW       ██████████████████████████████ 7
TOTAL     ████████████████████████████████████████████████████████████████████ 40
```

---

## CRITICAL FINDINGS (Immediate Action Required)

### C-01: `insert_notification()` Security Definer Bypasses RLS

**File:** `supabase/migrations/016_notification_rpc.sql`
**Risk:** Any authenticated user can create notifications for any other user

The function `public.insert_notification()` uses `SECURITY DEFINER` which bypasses Row Level Security. The RLS on `notifications` restricts `user_id = auth.uid()`, but this function ignores that restriction. An attacker can:
- Create phishing notifications that appear to come from the system
- Send notifications with malicious links to any user
- Spam all users with unwanted notifications

**Fix:** Change to `SECURITY INVOKER` or add `WHERE p_user_id = auth.uid()` check inside the function.

---

### C-02: `increment_resource_field()` SQL Injection via Dynamic EXECUTE

**File:** `supabase/migrations/024_resource_functions.sql`
**Risk:** Authenticated users can increment arbitrary numeric fields on any resource

```sql
EXECUTE format('update public.resources set %I = greatest(0, %I + $1) where id = $2', field, field)
```

While `%I` prevents classic SQL injection by quoting the identifier, the `field` parameter is not validated against an allowlist. Combined with the SECURITY DEFINER context:
- Attacker can target hidden/internal columns
- No permission check beyond RLS bypass

**Fix:** Add an allowlist of permitted fields: `IF field NOT IN ('views_count', 'downloads_count', 'favorites_count') THEN RAISE ...`

---

### C-03: Multiple SECURITY DEFINER Functions Without Explicit `search_path`

**Files:** Multiple migrations (030, 023, 025, 036)
**Risk:** Privilege escalation via search_path injection

Functions like `handle_student_crm_creation()`, `handle_review_growth_score()`, `handle_provisioning_jobs_updated_at()`, and others use `SECURITY DEFINER` without setting `search_path`. An attacker who can create database objects (e.g., in the `extensions` schema or a compromised user schema) could create objects with the same name that would be resolved before the intended public schema objects.

**Affected functions:**
- `handle_review_growth_score()` (migration 025)
- `increment_resource_downloads()` (migration 023)
- `increment_resource_views()` (migration 023)
- `increment_resource_completions()` (migration 023)
- `handle_provisioning_jobs_updated_at()` (migration 036)
- `log_gallery_activity()` (migration 028)

**Fix:** Add `SET search_path = public` to every SECURITY DEFINER function.

---

### C-04: `get_upcoming_events()` Leaks Draft Events

**File:** `supabase/migrations/027_events_module14_fix.sql`
**Risk:** Draft events visible to all authenticated users

```sql
CREATE FUNCTION public.get_upcoming_events() RETURNS TABLE(...)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT ... FROM public.events e
  WHERE e.status IN ('published', 'draft')  -- DRAFT included!
    AND (e.date >= current_date ...)
$$;
```

**Fix:** Remove `'draft'` from the status filter, or add a role check for event creators.

---

### C-05: `upsert_recently_viewed()` Allows Cross-User Data Manipulation

**File:** `supabase/migrations/026_resource_completions.sql`
**Risk:** Any authenticated user can insert/update recently_viewed for any user

```sql
CREATE FUNCTION public.upsert_recently_viewed(p_user_id uuid, p_resource_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
  INSERT INTO public.recently_viewed (user_id, resource_id, viewed_at)
  VALUES (p_user_id, p_resource_id, now())
  ON CONFLICT (user_id, resource_id) DO UPDATE SET viewed_at = now();
$$;
```

**Fix:** Remove the `p_user_id` parameter and use `auth.uid()` inside the function.

---

### C-06: Temporary Password Sent in Plain Text Email

**File:** `supabase/functions/approve-application/index.ts:319`
**Risk:** Credential exposure via email

The approved user's temporary password is included in the welcome email HTML body:

```typescript
html: `<p><strong>Temporary Password:</strong> ${ctx.tempPassword}</p>`
```

This violates security best practices. Passwords transmitted via email are stored in:
- Email server logs
- Recipient's email client (potentially indefinitely)
- Any intermediary email gateways

**Fix:** Send a password reset link instead of the actual password. The user should set their own password upon first login.

---

## HIGH FINDINGS (Must Fix Before Launch)

### H-01: Weak Temporary Password Generation
**File:** `supabase/functions/approve-application/index.ts:172`
**Issue:** `crypto.randomUUID() + '!Aa1'` uses hex chars only [0-9a-f], dramatically reducing entropy.
**Fix:** Use `crypto.randomBytes(16)` or similar with full character set.

### H-02: Gallery Items `USING(true)` for Authenticated Users
**File:** `supabase/migrations/028_gallery_module.sql`
**Issue:** Any authenticated user can read ALL gallery items including draft/archived.
**Fix:** Restrict to `visibility = 'published'` or check owner/editor role.

### H-03: No Spam Protection on Applications Insert
**File:** `supabase/migrations/999_rls.sql`
**Issue:** `CREATE POLICY "Anyone can submit application" ... WITH CHECK (true)` — no rate limiting.
**Fix:** Add Supabase rate limiting or application-level CAPTCHA/email verification.

### H-04: `public-website` Bucket Allows Any Authenticated User Upload
**File:** `supabase/migrations/030_messaging_fixes.sql`
**Issue:** `TO authenticated WITH CHECK (bucket_id = 'public-website')` — no role restriction.
**Fix:** Add `AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')`.

### H-05: Anonymous Read for Application Documents
**File:** `supabase/migrations/017_public_storage.sql`
**Issue:** `TO public` can read files in `applications/` folder in student-documents bucket.
**Fix:** Require authentication for document reads, or scope to specific user folders.

### H-06: `message-attachments` Insecure LIKE Pattern Matching
**File:** `supabase/migrations/030_messaging_fixes.sql`
**Issue:** `WHERE m.file_url LIKE '%' || name || '%'` — LIKE with surrounding wildcards can match incorrectly.
**Fix:** Use path-based join or `storage.foldername(name)` matching.

### H-07: Gemini API — Full User Context Sent Without Sanitization
**File:** `supabase/functions/gemini/index.ts:18`
**Issue:** `JSON.stringify(context, null, 2).slice(0, 20000)` sends full context to Google Gemini API.
**Fix:** Implement PII stripping before sending data to third-party AI.

### H-08: Gemini API — Key Leakage in Error Messages
**File:** `supabase/functions/gemini/index.ts:74`
**Issue:** Raw Gemini API error messages forwarded to client, potentially exposing API key.
**Fix:** Sanitize error responses before forwarding to clients.

### H-09: Gemini API — Key in URL Query Parameter
**File:** `supabase/functions/gemini/index.ts:60,125`
**Issue:** `?key=${apiKey}` as query parameter — leaks in server logs, referrer headers.
**Fix:** Use `X-Goog-Api-Key` header instead of URL query parameter.

### H-10: Stale JWT Role Claims Bypass Profile Table
**File:** `src/context/AuthContext.tsx:106`
**Issue:** When profile fetch fails, falls back to JWT `user_metadata.role` which may be stale.
**Fix:** Validate role against profiles table; if unreachable, default to most restrictive role (`visitor`).

### H-11: HTML Injection in Email Templates
**Files:** `supabase/functions/resend/index.ts`, `supabase/functions/scheduled/index.ts`
**Issue:** User-controlled data inserted into email HTML without escaping.
**Fix:** Escape all dynamic values: `data.name.replace(/[<>]/g, '')` or use a proper templating engine.

### H-12: CORS Wildcard on All Edge Functions
**Files:** All edge functions via `middleware/auth.ts`
**Issue:** `Access-Control-Allow-Origin: *` allows any website to invoke functions from a user's browser.
**Fix:** Restrict to specific origins (e.g., `https://mentorino.app`).

### H-13: No Rate Limiting on Edge Functions
**Files:** `functions/gemini/index.ts`, `functions/resend/index.ts`, `functions/approve-application/index.ts`
**Issue:** No rate limiting — attacker can exhaust API quota or incur high costs.
**Fix:** Implement in-memory rate limiting or use Supabase's built-in rate limiting.

### H-14: No Email Verification Check
**File:** `src/services/authService.ts`
**Issue:** No check for `email_confirmed_at` before granting access.
**Fix:** Verify email confirmation status after sign-in; require confirmation for sensitive operations.

### H-15: Missing Production Monitoring
**DevOps Issue**
**Issue:** Sentry is optional; no alerting configured for production.
**Fix:** Make Sentry mandatory in production; configure error alerting.

### H-16: Low Code Coverage (2.35%)
**DevOps/QA Issue**
**Issue:** Only 67 tests covering 2.35% of codebase.
**Fix:** Add unit tests for critical paths (auth, RLS, edge functions).

### H-17: No CI Security Scanning
**DevOps Issue**
**Issue:** No CodeQL, dependency audit, or SAST in CI pipeline.
**Fix:** Add `npm audit`, CodeQL analysis, and dependency review to GitHub Actions.

---

## MEDIUM FINDINGS (Fix Within First Week)

| ID | Component | Issue | File |
|----|-----------|-------|------|
| M-01 | Database | `increment_gallery_view_count()` security definer without owner check | `migrations/028_gallery_module.sql` |
| M-02 | Database | `event_activity` insert allows any authenticated user to inject fake activity | `migrations/027_events_module14_fix.sql` |
| M-03 | Database | Products with `status = 'inactive'` visible via `USING(true)` | `migrations/999_rls.sql` |
| M-04 | Storage | Path traversal potential in `storageService.delete()` URL parsing | `src/services/storageService.ts` |
| M-05 | Auth | No explicit email verification check before login | `src/services/authService.ts` |
| M-06 | Config | Fallback to localhost Supabase when env vars missing | `src/lib/supabase.ts` |
| M-07 | Logging | Redaction regex may miss some sensitive patterns | `src/lib/logger.ts` |
| M-08 | Edge Function | CRON_SECRET comparison is constant-time but no rate limit on scheduled | `functions/scheduled/index.ts` |
| M-09 | Edge Function | No input size limits on Gemini prompts | `functions/gemini/index.ts` |
| M-10 | Database | Visitor bookings no rate limiting | `migrations/018_visitor_bookings.sql` |

---

## LOW FINDINGS (Fix Within First Month)

| ID | Component | Issue | File |
|----|-----------|-------|------|
| L-01 | Config | `VITE_POSTHOG_API_KEY` not validated in envValidator | `src/lib/envValidator.ts` |
| L-02 | Logging | Env summary logged to browser console in production | `src/lib/productionGuard.ts` |
| L-03 | Storage | Filename sanitization allows `.` character | `src/services/storageService.ts` |
| L-04 | Database | `analytics_events` insert allows any authenticated user to pollute analytics | `migrations/999_rls.sql` |
| L-05 | Database | `social_links` public read exposes `created_by` UUID | `migrations/029_module19_complete.sql` |
| L-06 | Edge Function | No pagination in scheduled task queries | `functions/scheduled/index.ts` |
| L-07 | Edge Function | `authHeader.replace('Bearer ', '')` no token format validation | `functions/middleware/auth.ts` |

---

## Database RLS Coverage

| Table | RLS Enabled | Policy Coverage | Status |
|-------|-------------|-----------------|--------|
| profiles | ✅ Yes | Full (JWT-based role checks) | ✅ Good |
| programs | ✅ Yes | Mentor/student scoped | ✅ Good |
| sessions | ✅ Yes | Mentor/student participant | ✅ Good |
| messages | ✅ Yes | Conversation participant | ✅ Good |
| conversations | ✅ Yes | Participant only | ✅ Good |
| conversation_participants | ✅ Yes | Self-read only | ✅ Good |
| notifications | ✅ Yes | Own notifications only | ⚠️ C-01 bypass |
| applications | ✅ Yes | Anyone insert, owner/mentor read | ⚠️ H-03 |
| events | ✅ Yes | Published read, mentor write | ⚠️ C-04 leak |
| gallery_items | ✅ Yes | Published read, authenticated | ❌ H-02 |
| visitor_bookings | ✅ Yes | Anyone insert | ⚠️ M-10 |
| products | ✅ Yes | Anyone read | ⚠️ M-03 |
| analytics_events | ✅ Yes | Any authenticated insert | ⚠️ L-04 |
| social_links | ✅ Yes | Public read | ⚠️ L-05 |

---

## Storage Bucket RLS

| Bucket | Public | Write Policy | Issue |
|--------|--------|-------------|-------|
| profile-avatars | ✅ Public | Owner only | ✅ Good |
| student-documents | ❌ Private | Owner/mentor | ⚠️ H-05 (anon read) |
| mentor-resources | ❌ Private | Mentor only | ✅ Good |
| gallery-images | ✅ Public | mentor | ✅ Good |
| message-attachments | ❌ Private | Conversation participant | ⚠️ H-06 |
| public-website | ✅ Public | ANY authenticated | ❌ H-04 |

---

## Edge Function Security

| Function | Auth | Role Check | Rate Limiting | Input Validation | Issues |
|----------|------|-----------|---------------|-----------------|--------|
| gemini | ✅ JWT | ✅ student/mentor | ❌ None | ❌ No prompt validation | H-07, H-08, H-09, M-09 |
| resend | ✅ JWT | ✅ mentor | ❌ None | ❌ No HTML escaping | H-11, H-12 |
| approve-application | ✅ JWT | ✅ mentor | ❌ None | ⚠️ Partial | C-06, H-01 |
| scheduled | ✅ CRON_SECRET | N/A (cron) | ❌ None | ❌ No input validation | H-11, M-08 |

---

## Recommendations

### Immediate (Before Launch)
1. Fix all 6 CRITICAL issues
2. Fix all 17 HIGH issues
3. Re-deploy Supabase migrations
4. Re-deploy edge functions
5. Run E2E tests in staging
6. Increase test coverage to minimum 30%

### Short-Term (First Week)
1. Fix all MEDIUM issues
2. Add security scanning to CI/CD
3. Configure Sentry alerts for production
4. Implement rate limiting on edge functions
5. Add email verification checks

### Medium-Term (First Month)
1. Fix all LOW issues
2. Implement PII sanitization for AI context
3. Add CSP headers
4. Implement audit logging for sensitive operations
5. Conduct penetration testing
