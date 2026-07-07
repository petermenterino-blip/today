# Phase 1 Implementation Report — RLS Security Hardening

**Date:** 2026-07-06  
**Lead:** Senior Supabase Architect  
**Phase:** 1 of 6 (RLS Security Implementation)  
**Migration:** `035_secure_rls_policies.sql`

---

## Summary

Phase 1 replaces permissive/blanket RLS policies with least-privilege, role-and-owner
scoped policies across all tables identified as vulnerable in the Phase 0 audit.

### What was fixed

| Category | Count | Change |
|----------|-------|--------|
| 🔴 CRITICAL — Blanket "Authenticated full access" | 11 tables | Dropped `FOR ALL USING auth.role() = 'authenticated'` policies, restored/replaced with granular policies |
| 🔴 CRITICAL — Storage bucket over-permissive | 1 policy | Scoped mentor `shared_files` access to only their assigned students |
| 🟡 MEDIUM — Duplicate broad mentor profiles policies | 2 policies | Dropped "Mentors can read/update all student profiles", kept scoped versions |
| 🟡 MEDIUM — Missing policies | 5 tables | Added policies for `application_info_requests`, `dashboard_layouts` (UPDATE/DELETE), `tasks` (DELETE), `student_timeline_events` (mentor SELECT) |
| 🔧 REFACTOR — Inline profiles queries | 8 policies | Replaced `EXISTS (SELECT 1 FROM profiles WHERE role = 'mentor')` with JWT-based `is_mentor()` |
| 🛡️ MENTOR — Missing mentor policies | 12 tables | Added `FOR ALL USING public.is_admin()` for journals, bookings, messages, conversations, conversation_participants, mentor_settings, tags, student_tags, announcements, products, transactions, ai_chat_history |

---

## Migration Structure

The migration (`supabase/migrations/035_secure_rls_policies.sql`) is fully reversible.

### UP section (7 steps)
1. **Ensure helper functions** — `is_mentor()` and `is_admin()` (JWT-based, idempotent)
2. **Drop "Authenticated full access"** on 11 tables; restore/create granular policies
3. **Fix shared_files storage policy** — scope mentor access to assigned students only
4. **Reconcile duplicate mentor profiles policies** — drop broad, keep scoped
5. **Add missing policies** — to application_info_requests, dashboard_layouts, tasks, student_timeline_events
6. **Replace inline profiles queries** with `is_mentor()` for consistency
7. **Add mentor policies** to 12 key tables

### DOWN section (7 steps, reverse order)
- Drops all policies created in UP
- Restores original permissive policies (including the blanket "Authenticated full access")

---

## Design Decisions

### Why JWT-based `is_mentor()` instead of profiles queries?
- **Performance:** JWT claims are available in-memory; no table scan needed
- **Recursion safety:** Profiles queries inside profiles policies cause infinite recursion
  (PostgreSQL >= 14 detects this)
- **Consistency:** All policies use the same pattern

### Why scoped mentor SELECT on `shared_files`?
The original policy allowed any mentor to read any student's files. The fix uses
`storage.foldername(name)` to extract the student UUID from the storage path and verifies
the mentor-student relationship. This assumes the first path segment is the student UUID,
which is the convention established by the shared_files client code.

### Why are some `auth.role() = 'authenticated'` SELECT policies kept?
Event child tables, resources, announcements, and tags are content-library tables where
SELECT by any authenticated user is by design. These tables have granular INSERT/UPDATE/
DELETE policies for write operations.

---

## Testing

### Manual verification checklist
1. Authenticate as a student → verify you can only see/modify your own data
2. Authenticate as a mentor → verify you can see assigned students' data but not others'
3. Authenticate as a mentor → verify full access
4. Unauthenticated → verify access denied (except public submission endpoints)
5. Verify `shared_files` bucket: mentor can only access files in their students' folders
6. Verify `resource_completions`: student can insert/read own; mentor reads assigned only
7. Verify `reviews`: student reads own; mentor manages assigned

### SQL verification queries
```sql
-- Check all policies on all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Check no "Authenticated full access" policies remain
SELECT tablename FROM pg_policies
WHERE policyname = 'Authenticated full access';

-- Check all storage policies
SELECT * FROM pg_policies
WHERE schemaname = 'storage';
```

---

## Rollback

See `PHASE1_ROLLBACK.md` for detailed rollback instructions.

Quick rollback: Apply the DOWN section of `035_secure_rls_policies.sql`.

---

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/035_secure_rls_policies.sql` | CREATE | Reversible migration with UP/DOWN |
| `docs/RLS_SECURITY_MATRIX.md` | CREATE | Complete table-by-table audit |
| `docs/DATABASE_SECURITY_REPORT.md` | CREATE | Security findings and residual risks |
| `docs/RLS_POLICY_DOCUMENTATION.md` | CREATE | Comprehensive policy reference |
| `docs/PHASE1_IMPLEMENTATION.md` | CREATE | This file |
| `docs/PHASE1_ROLLBACK.md` | CREATE | Rollback guide |
| `docs/PHASE1_SUMMARY.md` | CREATE | Executive summary |
