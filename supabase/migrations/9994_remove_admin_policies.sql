-- 9994_remove_admin_policies.sql
-- Removes obsolete "Admins full access" RLS policies re-created by
-- migration 9991_optimization.sql section 2t after migration
-- 038_remove_admin_role.sql removed the 'admin' application role.
--
-- The 'admin' role no longer exists (CHECK constraint is now
-- ('student', 'mentor')), so these policies are dead code.
-- Mentor and student policies already cover all legitimate access.
--
-- This migration runs AFTER 9991_optimization.sql (filename sort),
-- so it catches policies that 9991 may have re-created on fresh installs.

-- ── 1. Drop the 8 specific policies from 9991_optimization.sql section 2t ──
do $$
begin
  -- profiles
  if exists (select 1 from pg_policies where policyname = 'Admins full access to profiles') then
    drop policy "Admins full access to profiles" on public.profiles;
  end if;

  -- sessions
  if exists (select 1 from pg_policies where policyname = 'Admins full access to sessions') then
    drop policy "Admins full access to sessions" on public.sessions;
  end if;

  -- goals
  if exists (select 1 from pg_policies where policyname = 'Admins full access to goals') then
    drop policy "Admins full access to goals" on public.goals;
  end if;

  -- tasks
  if exists (select 1 from pg_policies where policyname = 'Admins full access to tasks') then
    drop policy "Admins full access to tasks" on public.tasks;
  end if;

  -- applications
  if exists (select 1 from pg_policies where policyname = 'Admins full access to applications') then
    drop policy "Admins full access to applications" on public.applications;
  end if;

  -- programs
  if exists (select 1 from pg_policies where policyname = 'Admins full access to programs') then
    drop policy "Admins full access to programs" on public.programs;
  end if;

  -- events
  if exists (select 1 from pg_policies where policyname = 'Admins full access to events') then
    drop policy "Admins full access to events" on public.events;
  end if;

  -- notifications
  if exists (select 1 from pg_policies where policyname = 'Admins full access to notifications') then
    drop policy "Admins full access to notifications" on public.notifications;
  end if;
end $$;

-- ── 2. Safety net: drop any remaining "Admins full access" policies ──
-- Covers edge cases where other migrations may have created similar policies.
do $$
declare
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

-- ── 3. Verification queries (run manually after migration) ──
/*
-- 3a. Confirm zero "Admins full access" policies remain:
select * from pg_policies where policyname like 'Admins full access to%';

-- 3b. Confirm no policy references the 'admin' role:
select * from pg_policies
where (pg_get_expr(polqual, polrelid) || pg_get_expr(polwithcheck, polrelid))
like '%admin%';

-- 3c. Confirm the is_admin() function no longer exists:
select proname from pg_proc where proname = 'is_admin';
*/
