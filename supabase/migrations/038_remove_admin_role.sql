-- 038_remove_admin_role.sql
-- Removes the 'admin' role from the application.
-- Admin becomes Mentor — all existing admin users are migrated to mentor.
-- All admin-only policies are dropped (mentors already have equivalent access).
-- The is_admin() function is dropped.

-- ── 1. Migrate existing admin profiles to mentor ──
update public.profiles
set role = 'mentor'
where role = 'admin';

-- ── 2. Update the CHECK constraint on profiles.role ──
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'mentor'));

-- ── 3. Drop all "Admins full access to ..." policies first (they depend on is_admin()) ──
-- These were created in migrations 032, 035, and 9991.
-- Mentors already have their own granular policies via is_mentor() and role-based checks.

do $$ declare
  rec record;
begin
  for rec in
    select policyname, tablename, schemaname
    from pg_policies
    where policyname like 'Admins full access to%'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      rec.policyname, rec.schemaname, rec.tablename
    );
  end loop;
end $$;

-- ── 4. Drop the is_admin() function ──
drop function if exists public.is_admin();

-- NOTE: Migration 9991_optimization.sql runs AFTER this file and will
-- RE-CREATE the "Admins full access to ..." policies for 8 tables
-- (profiles, sessions, goals, tasks, applications, programs, events,
-- notifications) if it has not been applied yet (fresh install scenario).
-- Those policies use `role = 'admin'` checks which will never match
-- after this migration updates the CHECK constraint to `('student','mentor')`.
-- They are effectively dead code on fresh installs.
-- On existing deployments (production), 9991 was already applied and
-- will not re-run, so the policies are permanently removed.
