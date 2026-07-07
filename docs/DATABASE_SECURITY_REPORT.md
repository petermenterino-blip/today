# Database Security Report — Phase 1

**Date:** 2026-07-06  
**Scope:** Row-Level Security audit of all 55+ tables and 3 storage buckets  
**Reviewer:** Senior Supabase Architect (Phase 1 Agent)  
**Status:** 11 critical vulnerabilities fixed, 6 informational items documented

---

## Executive Summary

The Mentorino database has 55 tables with RLS enabled. Prior to this phase, **11 tables** had
blanket "Authenticated full access" policies (`FOR ALL USING auth.role() = 'authenticated'`)
that allowed **any authenticated user** full CRUD access. Additionally, **1 storage policy**
allowed **any mentor** to access **any student's files** regardless of assignment.

This report documents all findings, fixes, and residual risks.

---

## 🔴 Critical Severity (Fixed)

### Finding CR-01: Blanket "Authenticated full access" on 11 tables

**Affected tables:** `resource_categories`, `resource_favorites`, `resource_comments`,
`resource_versions`, `resource_activity`, `resource_completions`, `resource_downloads`,
`resource_assignments`, `recently_viewed`, `reviews`, `review_history`

**Original policy (migration 034):**
```sql
CREATE POLICY "Authenticated full access" ON <table> FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

**Impact:** Any authenticated user (student, mentor, or anyone with a valid JWT) could
SELECT, INSERT, UPDATE, and DELETE any row in these 11 tables. This includes:
- Deleting other users' resource comments
- Modifying review scores and feedback
- Viewing and modifying resource assignments meant for other students
- Deleting or modifying resource categories
- Viewing and tampering with review history audit trail

**Fix applied in migration 035:**
- 7 tables already had granular policies from migration 023 — blanket policy dropped,
  granular policies restored.
- 4 tables (`resource_completions`, `recently_viewed`, `reviews`, `review_history`) had
  NO granular policies — replaced with owner/role-scoped policies:
  - `resource_completions`: students manage own, mentors read assigned
  - `recently_viewed`: users manage own
  - `reviews`: students read own, mentors manage assigned
  - `review_history`: participants read/insert

---

### Finding CR-02: Any mentor can access any student's files

**Affected resource:** `storage.objects` — `shared_files` bucket

**Original policy (migration 020):**
```sql
CREATE POLICY "shared_files_mentor_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'shared_files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor'));
```

**Impact:** Any mentor could read, write, update, or delete any file in the `shared_files`
bucket, including files belonging to students they do not mentor. Since shared files may
contain sensitive documents (resumes, ID proofs, assessments), this is a data isolation
breach.

**Fix applied in migration 035:**
```sql
CREATE POLICY "shared_files_mentor_assigned" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'shared_files' AND public.is_mentor() AND
    EXISTS (SELECT 1 FROM profiles
      WHERE id = (storage.foldername(name))[1]::uuid AND mentor_id = auth.uid()));
```

The policy extracts the student UUID from the first path segment of the file name and
verifies the mentor-student relationship via `profiles.mentor_id`.

---

## 🟠 High Severity (Accepted)

### Finding HI-01: Authenticated SELECT on event child tables

**Affected tables:** `event_attendees`, `event_files`, `event_feedbacks`, `event_recordings`

**Policy pattern (migrations 999_rls.sql):**
```sql
CREATE POLICY "Authenticated users can read <table>" ON <table> FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Rationale for acceptance:** Event attendance, files, feedback, and recordings are
public-facing data by design. Any authenticated user (event participant) should be able to
see who else is attending and access shared event materials. These tables already have
granular INSERT/UPDATE/DELETE policies. No fix applied.

### Finding HI-02: Authenticated SELECT on resource/announcement/tag tables

**Affected tables:** `resources`, `announcements`, `tags`, `student_tags`, `surveys`,
`resource_categories`, `resource_tags`

**Policy pattern:**
```sql
CREATE POLICY "Authenticated users can read <table>" ON <table> FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Rationale for acceptance:** These are content-library tables where any authenticated
user should be able to browse available resources, announcements, and tags. No sensitive
data is exposed. No fix applied.

---

## 🟡 Medium Severity (Fixed)

### Finding ME-01: Duplicate broad mentor policies on `profiles`

**Original state:** Two competing sets of policies on `profiles`:
- Scoped policies: "Mentors can read assigned students" (SELECT, any student),
  "Mentors can update students they mentor" (UPDATE, `mentor_id = auth.uid()`)
- Broad policies: "Mentors can read all student profiles" (SELECT, any student),
  "Mentors can update all student profiles" (UPDATE, any student)

Since PostgreSQL OR-s policies with different names, the broad policies effectively
allowed mentors to read/update **any** student's profile, not just their assigned students.

**Fix:** Dropped the two broad policies, kept the scoped ones.

### Finding ME-02: Missing policies on `application_info_requests`

**Original state:** RLS was probably enabled but no policies existed. Every query to this
table would be denied by default.

**Fix:** Created SELECT/INSERT policies for users and SELECT/UPDATE policies for mentors.

### Finding ME-03: Missing UPDATE/DELETE on `dashboard_layouts`

**Original state:** Only SELECT and INSERT policies existed. Users could create and read
their layouts but never update or delete them.

**Fix:** Added UPDATE and DELETE policies scoped to `user_id = auth.uid()`.

### Finding ME-04: Missing DELETE on `tasks`

**Original state:** Mentors could insert and update tasks but not delete them.

**Fix:** Added DELETE policy scoped to `mentor_id = auth.uid()`.

### Finding ME-05: Missing mentor SELECT on `student_timeline_events`

**Original state:** Only students could read their own timeline events and mentors could
create events, but mentors couldn't read them back.

**Fix:** Added SELECT policy for mentors scoped to their assigned students.

---

## 🟢 Low Severity (Noted)

### Finding LO-01: `applications` table allows unauthenticated INSERT

**Policy:** `CREATE POLICY "Anyone can submit application" ON applications FOR INSERT WITH CHECK (true);`

**Note:** This is intentional — the platform allows unauthenticated users to submit
applications. The `applications` table does not contain sensitive data beyond what the
applicant voluntarily provides.

### Finding LO-02: Inline `profiles` queries not yet using `is_mentor()` in all locations

**Note:** Most policies have been migrated to use `public.is_mentor()` (JWT-based).
A few remaining policies in migrations 020 (`shared_files` table) and 023 (`resource_*`
tables) use inline `EXISTS (SELECT 1 FROM profiles...)`. These do not cause recursion
(different table) and the pattern is functionally equivalent. Migration 035 converts
these to `is_mentor()` for consistency.

---

## Residual Risks

| ID | Risk | Severity | Notes |
|----|------|----------|-------|
| RR-01 | No automated RLS tests | 🟠 | No CI step validates policy correctness |
| RR-02 | No RLS policy review in deployment pipeline | 🟠 | New migrations can introduce permissive policies without review |
| RR-03 | Service role key exists in production | 🔴 | Any code with the service role key bypasses ALL RLS |
| RR-04 | Browser-side account creation (Phase 2) | 🔴 | Currently uses `supabase.auth.admin.createUser()` in Edge Functions |
| RR-05 | Some tables still lack mentor FOR ALL override | 🟡 | Mentor must use service_role for those tables |
| RR-06 | `shared_files_student_read` uses folder name matching | 🟢 | Relies on client creating correct folder structure; no server-side validation |

---

## Recommendations

1. **Phase 2 priority:** Move all mentor-privileged operations (account creation, role
   changes) to server-only Edge Functions with proper authorization checks.
2. **Add RLS tests:** Create a test suite that authenticates as different roles and
   verifies that each policy permits/denies the expected operations.
3. **Policy review checklist:** Add a PR checklist item requiring RLS policy review for
   all new migrations.
4. **Rotate service role key:** After completing all security phases, rotate the service
   role key to ensure no leaked key remains valid.
5. **Audit client-side code:** Review `applicationService.ts` and similar files to ensure
   they use the anon key (with RLS) rather than the service role key.
