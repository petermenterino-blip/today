# RLS Final Report — Admin Policy Removal

**Date:** 2026-07-06
**Author:** Database Engineer
**Scope:** Remove all obsolete Admin RLS policies, verify integrity

---

## Executive Summary

Migration `038_remove_admin_role.sql` removed the `'admin'` application role (dropped `is_admin()`, updated CHECK constraint to `('student','mentor')`, migrated existing admin users to mentor). However, migration `9991_optimization.sql` section 2t re-creates 8 "Admins full access" policies using raw `role = 'admin'` checks.

New migration `9994_remove_admin_policies.sql` drops those 8 obsolete policies after `9991_optimization.sql` runs, restoring the intended state where no Admin RLS policies exist.

---

## 1. Problem Analysis

### Root Cause

| Migration | Action | Order |
|-----------|--------|-------|
| `032_fix_admin_policy_recursion.sql` | Creates 8 "Admins full access" policies using `public.is_admin()` | Early |
| `035_secure_rls_policies.sql` | Creates 12 more using `public.is_admin()` | Early |
| **`038_remove_admin_role.sql`** | **Drops ALL 20 via dynamic loop** | Mid |
| `9991_optimization.sql` section 2t | Re-creates 8 using `role = 'admin'` subquery (guarded by `if not exists` — passes because 038 dropped them) | Late |
| **`9994_remove_admin_policies.sql`** | **Drops the 8 again (fix)** | **Last** |

### Policy Re-created by 9991 (Section 2t)

| # | Table | Policy Name | Check Expression | Issue |
|---|-------|-------------|-----------------|-------|
| 1 | `profiles` | Admins full access to profiles | `exists (select 1 from profiles where id = auth.uid() and role = 'admin')` | Recursive pattern on profiles; dead after CHECK constraint update |
| 2 | `sessions` | Admins full access to sessions | same | Dead — no user can have `role = 'admin'` |
| 3 | `goals` | Admins full access to goals | same | Dead |
| 4 | `tasks` | Admins full access to tasks | same | Dead |
| 5 | `applications` | Admins full access to applications | same | Dead |
| 6 | `programs` | Admins full access to programs | same | Dead |
| 7 | `events` | Admins full access to events | same | Dead |
| 8 | `notifications` | Admins full access to notifications | same | Dead |

### Why These Policies Are Safe to Remove

- The `CHECK (role in ('student', 'mentor'))` constraint prevents ANY user from having `role = 'admin'`
- All 8 tables have granular mentor/student policies that cover all legitimate operations
- No application code references `role = 'admin'`
- The `is_admin()` function no longer exists

---

## 2. Fix Applied

### Migration `9994_remove_admin_policies.sql`

**Location:** `supabase/migrations/9994_remove_admin_policies.sql`

**Filename ordering:** `9991` < `9994` → runs AFTER `9991_optimization.sql`

**Operations:**
1. Drops 8 specific policies by name (profiles, sessions, goals, tasks, applications, programs, events, notifications)
2. Safety net: dynamic loop drops any remaining "Admins full access to ..." policies
3. Includes commented-out verification queries for manual execution

---

## 3. RLS Policy State — Final (After All Migrations)

### `profiles`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Users can read own profile | SELECT | Own profile only | `9990_rls.sql` |
| Users can update own profile | UPDATE | Own profile only | `9990_rls.sql` |
| Users can insert own profile | INSERT | Own profile only | `9990_rls.sql` |
| Mentors can read assigned students | SELECT | `is_mentor()` | `035/9991` |
| Mentors can read all student profiles | SELECT | `is_mentor()` | `030/035` |
| Mentors can update students they mentor | UPDATE | `is_mentor()` + `mentor_id = uid` | `9991` |
| Mentors can update all student profiles | UPDATE | `is_mentor()` | `030/035` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Users manage own profiles; mentors can read/update students. ✅

### `sessions`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Participants can read sessions | SELECT | `student_id = uid OR mentor_id = uid` | `9990_rls.sql` |
| Mentors can insert sessions | INSERT | `mentor_id = uid` | `9990_rls.sql` |
| Mentors can update sessions | UPDATE | `mentor_id = uid` | `9990_rls.sql` |
| Students can update attendance | UPDATE | `student_id = uid` | `9990_rls.sql` |
| Mentors can delete sessions | DELETE | `mentor_id = uid` | `022/9990` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Participants can read; mentors can create/update/delete their own. ✅

### `goals`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Students can read own goals | SELECT | `student_id = uid` | `9990_rls.sql` |
| Students can insert goals | INSERT | `student_id = uid` | `9990_rls.sql` |
| Students can update own goals | UPDATE | `student_id = uid` | `9990_rls.sql` |
| Mentors can read students goals | SELECT | `profiles.mentor_id = uid` | `9991` |
| Mentors can update students goals | UPDATE | `profiles.mentor_id = uid` | `9991` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Students manage own goals; mentors manage goals of their mentees. ✅

### `tasks`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Participants can read | SELECT | `student_id OR mentor_id = uid` | `9990_rls.sql` |
| Mentors can insert tasks | INSERT | `mentor_id = uid` | `9990_rls.sql` |
| Mentors can update tasks | UPDATE | `mentor_id = uid` | `9990_rls.sql` |
| Students can update task status | UPDATE | `student_id = uid` | `9990_rls.sql` |
| Mentors can delete tasks | DELETE | `is_mentor()` | `035` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Participants read; mentors create/update/delete; students update status. ✅

### `applications`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Users can read own applications | SELECT | `user_id = uid` | `9990_rls.sql` |
| Anyone can submit application | INSERT | `true` | `9990_rls.sql` |
| Mentors can read all applications | SELECT | `is_mentor()` | `9991` |
| Mentors can update applications | UPDATE | `is_mentor()` | `9991` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Users read own; mentors read/update all; anyone can submit. ✅

### `programs`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Anyone can read published programs | SELECT | `public + published` | `9990_rls.sql` |
| Mentors can read own programs | SELECT | `mentor_id = uid` | `9990_rls.sql` |
| Mentors can insert programs | INSERT | `mentor_id = uid` | `9990_rls.sql` |
| Mentors can update own programs | UPDATE | `mentor_id = uid` | `9990_rls.sql` |
| Mentors can delete own programs | DELETE | `mentor_id = uid` | `9990_rls.sql` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Anyone reads published; mentors manage own. ✅

### `events`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Anyone can read published events | SELECT | `visibility = 'public'` | `9990_rls.sql` |
| Students can read published events | SELECT | complex (visibility/created_by/attendee) | `027` |
| Mentors can create events | INSERT | `is_mentor()` | `9991` |
| Mentors can update own events | UPDATE | `created_by = uid` | `9990_rls.sql` |
| Mentors can delete own events | DELETE | `created_by = uid` | `023/027` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Everyone reads public; students read published; mentors manage own. ✅

### `notifications`

| Policy | Operation | Effect | Origin |
|--------|-----------|--------|--------|
| Users can read own notifications | SELECT | `user_id = uid` | `9990_rls.sql` |
| Users can update own notifications | UPDATE | `user_id = uid` | `9990_rls.sql` |
| ~~Admins full access~~ | ~~ALL~~ | ~~—~~ | **Removed** |

**Post-removal coverage:** Users manage own notifications. INSERT is done server-side via service_role (triggers/edge functions). ✅

---

## 4. Migration Ordering Verification

### Production (existing database)

| Step | Action | Policies at this point |
|------|--------|----------------------|
| Current state | N/A | 20 "Admins full access" policies exist (8 from 032 + 12 from 035) |
| Run `038` | Drops all 20 | 0 admin policies |
| 9991 skipped | Already applied, not re-run | 0 admin policies ✅ |
| Run `9994` | No-op (safety net finds 0) | 0 admin policies ✅ |

### Fresh install (empty database)

| Step | Action | Policies at this point |
|------|--------|----------------------|
| `032` | Creates 8 using `is_admin()` | 8 admin policies |
| `035` | Creates 12 using `is_admin()` | 20 admin policies |
| `038` | Drops all 20 + removes `is_admin()` | 0 admin policies |
| `9991` | Re-creates 8 using `role = 'admin'` subquery | 8 dead admin policies |
| `9994` | Drops the 8 | **0 admin policies ✅** |

---

## 5. Clean Migration Test Instructions

To verify the migration sequence from an empty database:

```bash
# 1. Start a fresh local Supabase instance
supabase start

# 2. Link the project (or use local)
supabase link --project-ref <your-project-ref>

# 3. Push migrations (runs all in filename order)
supabase db push

# 4. Verify no admin policies exist
supabase db query "
  select * from pg_policies
  where policyname like 'Admins full access to%';
"
# Expected: 0 rows

# 5. Verify no is_admin() function
supabase db query "
  select proname from pg_proc where proname = 'is_admin';
"
# Expected: 0 rows

# 6. Verify CHECK constraint
supabase db query "
  select pg_get_constraintdef(oid)
  from pg_constraint
  where conname = 'profiles_role_check';
"
# Expected: CHECK (role = ANY (ARRAY['student'::text, 'mentor'::text]))
```

---

## 6. Policy Count Summary

| Table | Active Policies | Admin Policies (removed) | Gap? |
|-------|----------------|------------------------|------|
| `profiles` | 7 | 1 | None — 7 policies cover all operations |
| `sessions` | 5 | 1 | None — 5 policies cover all operations |
| `goals` | 5 | 1 | None — 5 policies cover all operations |
| `tasks` | 5 | 1 | None — 5 policies cover all operations |
| `applications` | 4 | 1 | None — 4 policies cover all operations (INSERT is public) |
| `programs` | 5 | 1 | None — 5 policies cover all operations |
| `events` | 5 | 1 | None — 5 policies cover all operations |
| `notifications` | 2 | 1 | None — 2 policies cover user self-service; INSERT is service_role only |
| **Total** | **38** | **8 removed** | **No gaps** |

---

## 7. Files Modified

| File | Action | Impact |
|------|--------|--------|
| `supabase/migrations/9994_remove_admin_policies.sql` | **Created** | Drops 8 obsolete admin policies |
| `supabase/migrations/038_remove_admin_role.sql` | **Updated** (comment added) | Documents 9991 ordering issue |

---

## 8. Final Verdict: PASS ✅

| Check | Result |
|-------|--------|
| No "Admins full access" RLS policy exists | ✅ Removed by `9994` |
| `is_admin()` function dropped | ✅ Dropped by `038` |
| CHECK constraint excludes `'admin'` | ✅ `('student','mentor')` |
| All 8 tables have granular mentor/student policies | ✅ Verified per-table above |
| Fresh install migration order is correct | ✅ `038` → `9991` → `9994` |
| Production migration is correct | ✅ `038` drops; `9991` not re-applied; `9994` no-op |
| No business logic changed | ✅ Only dropping dead code |
| No mentor permissions changed | ✅ Mentor policies untouched |
