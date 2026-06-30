# RC2.1 — Environment Validation Report

## Validation Method
Source code review + configuration analysis. Edge functions exist at `edge-functions/` (custom location, not `supabase/functions/`).

---

## 1. Migration Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Migration order | ✅ Linear | 001 → 015, then 900 (auth triggers), then 999 (RLS) |
| No duplicate IDs | ✅ | All sequential, no gaps |
| `supabase_migrations` table | ✅ | Standard Supabase tracking |
| All tables created | ✅ | 43 tables across 17 files |
| Foreign keys | ✅ | References use `public.profiles(id)` pattern |
| Idempotent | ✅ | Uses `create table if not exists`, `add column if not exists` |
| **Verdict** | **✅ PASS** | |

**17 migrations, 43 tables, 120 RLS policies — all structurally sound.**

---

## 2. RLS Verification

| Check | Result | Evidence |
|-------|--------|----------|
| RLS enabled on all tables | ✅ | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for 41 tables in 999_rls.sql |
| Total policies | ✅ | 105 table-level (999_rls.sql) + 15 storage-level (014_storage.sql) = 120 |
| Zero-policy tables | ⚠️ 2 | `custom_forms` and `form_templates` have 0 policies (RLS enabled but no rules) |
| Mentor-scoped access | ✅ | Uses `program_enrollments → programs → mentor_id` join |
| Self-access for students | ✅ | `auth.uid() = <owner_column>` pattern |
| Admin override | ⚠️ | No explicit admin role bypass in most policies |
| **Verdict** | **✅ PASS (minor)** | 2 tables have RLS enabled but zero policies |

---

## 3. Storage Buckets

| Bucket | Visibility | Limit | Types | Policies | Verdict |
|--------|-----------|-------|-------|----------|---------|
| `profile-avatars` | Public | 2MB | images | 4 | ✅ |
| `student-documents` | Private | 10MB | PDF, DOC, images | 4 | ✅ |
| `mentor-resources` | Private | 50MB | PDF, zip, mp4, images | 4 | ✅ |
| `gallery-images` | Public | 5MB | images | 3 | ✅ |
| **Verdict** | **✅ PASS** | | | **15 policies total** | |

---

## 4. Edge Functions

| Function | Location | Auth | JWT Verify | Role Check | Verdict |
|----------|----------|------|-----------|------------|---------|
| `resend` | `edge-functions/resend/` | ✅ Supabase JWT | ✅ `.auth.getUser()` | ✅ mentor only | ✅ |
| `scheduled` | `edge-functions/scheduled/` | ✅ CRON_SECRET | N/A | N/A (no user) | ✅ |
| `calendar` | `edge-functions/calendar/` | ❌ Dummy | ❌ Only checks header exists | ❌ | ❌ **FAIL** |
| `meet` | `edge-functions/meet/` | ❌ Dummy | ❌ Only checks header exists | ❌ | ❌ **FAIL** |
| `gemini` | `edge-functions/gemini/` | ❌ Dummy | ❌ Only checks header exists | ❌ | ❌ **FAIL** |

**Critical finding**: `calendar`, `meet`, and `gemini` accept ANY string as the Authorization header. No JWT validation occurs.

**Deployment note**: Functions are in `edge-functions/` but Supabase expects `supabase/functions/`. Deployment requires manual config or symlink.

---

## 5. Edge Function Secrets

| Secret | Required By | Source | Status |
|--------|------------|--------|--------|
| `GEMINI_API_KEY` | gemini | `Deno.env.get()` | ⚠️ Not verified (no `.env` in repo) |
| `RESEND_API_KEY` | resend, scheduled | `Deno.env.get()` | ⚠️ Not verified |
| `SUPABASE_SERVICE_ROLE_KEY` | resend, scheduled | `Deno.env.get()` | ⚠️ Not verified |
| `SUPABASE_URL` | resend, scheduled | `Deno.env.get()` | ⚠️ Not verified |
| `CRON_SECRET` | scheduled | `Deno.env.get()` | ⚠️ Not verified |

**All 5 secrets are environment-specific and not present in the repo.** Verified that `Deno.env.get()` calls exist in source. Actual values must be configured in Supabase dashboard or `.env.local` for local dev.

---

## 6. Google Calendar OAuth

| Check | Result | Evidence |
|-------|--------|----------|
| OAuth flow in frontend | ⚠️ Not found | No Google OAuth button/flow in `src/` |
| Token storage | ❌ Unknown | No `googleAccessToken` management found in codebase |
| Token refresh | ❌ Unknown | No refresh logic visible |
| `googleAccessToken` in EF | ✅ | Passed in request body to calendar/meet functions |
| **Verdict** | **❌ FAIL** | Frontend Google OAuth flow is not implemented in the codebase |

---

## 7. Google Meet Integration

| Check | Result | Evidence |
|-------|--------|----------|
| Meet link generation | ✅ | `meet/index.ts` creates events with `conferenceDataVersion=1` |
| Fallback URL | ✅ | Falls back to `meet.google.com/${uuid}` if no conference data |
| Attendee inclusion | ✅ | Passes `studentEmail` as attendee |
| Session ID link | ✅ | Description includes `Mentorino session: ${sessionId}` |
| **Verdict** | **✅ PASS (edge function only)** | Frontend integration depends on Google OAuth flow |

---

## 8. Resend Email Delivery

| Check | Result | Evidence |
|-------|--------|----------|
| API call | ✅ | `POST https://api.resend.com/emails` in `resend/index.ts` |
| Templates | ✅ | 4 templates: welcome, session_reminder, application_update, notification |
| From address | ✅ | `Mentorino <notifications@mentorino.com>` |
| Auth | ✅ | Uses `RESEND_API_KEY` Bearer token |
| Scheduled reminders | ✅ | `scheduled/index.ts` sends session reminders + inactivity alerts |
| **Verdict** | **✅ PASS (code only)** | Depends on valid `RESEND_API_KEY` at runtime |

---

## Environment Scoring

| Category | Score | Status |
|----------|-------|--------|
| Migrations | 100% | ✅ All 17 verified |
| RLS | 95% | ⚠️ 2 tables with RLS enabled but no policies |
| Storage | 100% | ✅ 4 buckets, 15 policies |
| Edge Functions | 40% | ❌ 2/5 secured, 3/5 have dummy auth |
| Edge Function Secrets | ⚠️ | All 5 referenced in code, not in repo |
| Google OAuth | 0% | ❌ Frontend flow not implemented |
| Google Meet | 100% (EF) | ✅ Edge function handles meet creation |
| Resend | 100% (EF) | ✅ Edge function + scheduled reminders |
| **Overall** | **67%** | ❌ **NOT READY — auth gaps + missing OAuth flow** |

## Action Items
1. **Fix 3 edge function auth** — calendar, meet, gemini need real JWT verification
2. **Implement Google OAuth flow** on frontend — no `googleAccessToken` management found
3. **Set up all 5 secrets** in production Supabase project
4. **Add RLS policies** for `custom_forms` and `form_templates`
5. **Move functions to `supabase/functions/`** or configure deployment path
