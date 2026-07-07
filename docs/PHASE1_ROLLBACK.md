# Phase 1 Rollback Guide — 035_secure_rls_policies

**Last updated:** 2026-07-06  
**Rollback type:** Reversible migration (contains both UP and DOWN)

---

## Rollback Procedure

### Quick Rollback (applying DOWN section)

Execute the DOWN section of `035_secure_rls_policies.sql` in your Supabase database.

**Using Supabase CLI:**
```bash
# If migration has been applied, run the DOWN SQL manually:
psql $DATABASE_URL -f supabase/migrations/035_secure_rls_policies.sql --variable=ACTION=DOWN
# Or extract and run only the DOWN section
```

**Using Supabase Dashboard:**
1. Go to SQL Editor
2. Copy the DOWN section of `035_secure_rls_policies.sql` (from the `-- DOWN` comment to end of file)
3. Execute

---

## What DOWN Does

The DOWN section restores the EXACT original state by reversing each UP step:

### Step 1 — Restore "Authenticated full access"
Re-applies the same dynamic DO block from migration 034:
```sql
CREATE POLICY "Authenticated full access" ON <table> FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```
on all 11 tables: `resource_categories`, `resource_favorites`, `resource_comments`,
`resource_versions`, `resource_activity`, `resource_completions`, `resource_downloads`,
`resource_assignments`, `recently_viewed`, `reviews`, `review_history`.

### Step 2 — Restore storage policy
Re-creates `shared_files_mentor_all` with the original permissive scope (any mentor,
any file).

### Step 3 — Restore duplicate mentor policies
Re-creates "Mentors can read all student profiles" and "Mentors can update all student
profiles" (the broad duplicate policies from migration 030).

### Step 4 — Restore shared_files table policies
Re-creates original policies with inline `EXISTS (SELECT 1 FROM profiles WHERE role = 'mentor')`.

### Step 5 — Drop newly added policies
Drops policies added for: `application_info_requests`, `dashboard_layouts` (UPDATE/DELETE),
`tasks` (DELETE), `student_timeline_events` (mentor SELECT).

### Step 6 — Restore inline profiles queries
Re-creates original inline profiles queries in resource_* policies.

### Step 7 — Drop mentor policies
Drops the 12 mentor policies added in UP section 7.

---

## Verification After Rollback

After rollback, verify the original state:
```sql
-- Confirm "Authenticated full access" policies exist
SELECT tablename FROM pg_policies
WHERE policyname = 'Authenticated full access';

-- Confirm shared_files_mentor_all exists
SELECT policyname FROM pg_policies
WHERE tablename = 'objects' AND policyname = 'shared_files_mentor_all';

-- Confirm broad mentor policies exist
SELECT policyname FROM pg_policies
WHERE tablename = 'profiles' AND policyname LIKE 'Mentors can % all student%';
```

---

## What is NOT Reverted by DOWN

The DOWN section does NOT revert:
- Indexes created by `999_optimization.sql` — they remain (and are beneficial)
- The `is_mentor()` and `is_admin()` functions (they remain; JWT-based is better)
- The `sync_profile_role_to_auth()` trigger (remains; keeps JWT in sync)
- Changes from other migrations (001-034) — only migration 035 changes are undone

---

## Disaster Recovery

If application functionality breaks after applying migration 035:

1. **Immediately apply DOWN section** — restores the original permissive state
2. **Tag the rollback** in git:
   ```bash
   git tag -a v1.1-rollback -m "Rolled back 035_secure_rls_policies"
   ```
3. **Inform the team** that RLS hardening has been reverted
4. **Debug** — check application logs for RLS policy errors or permission denied messages
5. **Retry with fixes** — adjust policies in migration 035 and re-apply

---

## Risk Assessment of Rollback

Rolling back re-introduces these vulnerabilities:
- 11 tables with blanket authenticated full access
- Any mentor accessing any student's shared files
- Duplicate over-broad mentor policies on profiles
- Missing policies causing default-deny on application_info_requests
- No mentor override on 12 key tables

Only roll back if absolutely necessary for production uptime.
