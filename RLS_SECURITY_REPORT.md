# RLS Security Report

**Date:** 2026-07-06
**Audit scope:** All RLS policies in `supabase/migrations/` (018, 014, 0302, 035, 9990, 9991, 038, 9994)

---

## Methodology

Read every `CREATE POLICY` statement across all migration files. Checked each for:
- Anonymous writes (INSERT/UPDATE/DELETE without `auth.role()` or `auth.uid()` check)
- Public storage bucket access
- Missing authentication gates
- Overly permissive UPDATE/DELETE policies

---

## Findings

### 1. `visitor_bookings` — INSERT allows anonymous

**Policy:** `"Anyone can insert visitor bookings"` — `with check (true)`
**File:** `018_visitor_bookings.sql:23-25`
**Verdict:** `BY DESIGN — NOT A SECURITY HOLE`

This is a public-facing booking form. Visitors land on the Mentorino website and book a discovery call without creating an account. Requiring authentication here would break the core enrollment funnel.

### 2. `applications` — INSERT allows anonymous

**Policy:** `"Anyone can submit application"` — `with check (true)`
**File:** `9990_rls.sql:460-463`
**Verdict:** `BY DESIGN — NOT A SECURITY HOLE`

Students must be able to apply to programs without having an account yet. The application flow creates their account AFTER approval (via the `approve-application` edge function). Requiring authentication pre-application would introduce a circular dependency.

### 3. `storage.objects` — student-documents bucket

**Policies:**
- `docs_student_write` — `TO authenticated` — OK
- `docs_student_read_own` — `TO authenticated` — OK
- `docs_mentor_read_assigned` — `TO authenticated` — OK
- `docs_owner_delete` — `TO authenticated` — OK

**Verdict:** `SECURE — no anonymous access`

The previous audit incorrectly flagged this as allowing anonymous writes. All policies on this bucket require `TO authenticated`.

### 4. `storage.objects` — all other buckets

| Bucket | INSERT Policy | Verdict |
|---|---|---|
| `profile-avatars` | `TO authenticated` | SECURE |
| `mentor-resources` | `TO authenticated` | SECURE |
| `gallery-images` | `TO authenticated` | SECURE |
| `shared_files` | `TO authenticated` | SECURE |
| `message-attachments` | `TO authenticated` | SECURE |
| `public-website` | `TO authenticated` | SECURE |

### 5. All other tables — SELECT/INSERT/UPDATE/DELETE policies

**Verdict:** `SECURE`

Every authenticated-only table policy includes either:
- `auth.role() = 'authenticated'` — requires login
- `auth.uid()` comparison — scoped to owner
- `public.is_mentor()` — requires mentor profile
- Subquery that checks profile role — scoped to authorized users

---

## Previously Reported Issues (Resolved)

| Reported Issue | Actual State | Resolution |
|---|---|---|
| Anonymous INSERT on `storage.objects` (student-documents) | Policies require `TO authenticated` | False positive from PRODUCTION_READINESS_AUDIT.md |
| `applications` no INSERT policy | `"Anyone can submit application"` with `with check (true)` | By design — application flow |
| `visitor_bookings` anonymous INSERT | `"Anyone can insert visitor bookings"` with `with check (true)` | By design — public booking form |

---

## Conclusion

**No RLS changes required.** All anonymous INSERT policies are intentional and support the application's core business flows. No storage bucket allows anonymous write access. All authenticated table policies properly restrict based on ownership or role.

**Validation:** No code was changed.
