-- ============================================================
-- FIX: Admin policy on profiles causes infinite RLS recursion
--
-- Problem:
--   The "Admins full access to profiles" policy did:
--     exists (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   This queries profiles *inside* a profiles RLS policy,
--   which re-evaluates the policies and recurses forever.
--
--   PG >= 14 detects this and throws:
--     "infinite recursion detected in policy for relation 'profiles'"
--
-- Fix:
--   Rewrite ALL admin-policies to use JWT claims instead of
--   inline profiles queries.  This is consistent with the
--   is_mentor() JWT approach from migration 031.
-- ============================================================

-- ── 1. Ensure sync trigger from 031 exists (idempotent) ──
create or replace function public.sync_profile_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'UPDATE' and new.role is not distinct from old.role then
    return new;
  end if;
  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_role_to_auth on public.profiles;
create trigger trg_sync_profile_role_to_auth
  after insert or update of role on public.profiles
  for each row
  execute function public.sync_profile_role_to_auth();

-- ── 2. One-shot sync existing roles so JWT claims are accurate ──
do $$
declare
  rec record;
begin
  for rec in select id, role from public.profiles loop
    update auth.users
    set raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', rec.role)
    where id = rec.id
      and coalesce(raw_user_meta_data->>'role', '') <> rec.role;
  end loop;
end;
$$;

-- ── 3. JWT-based is_mentor() (replaces any leftover old version) ──
create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'mentor';
$$;

-- ── 4. JWT-based is_admin() helper ──
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'admin';
$$;

-- ── 5. Rewrite profiles SELECT policy to use JWT directly ──
drop policy if exists "Mentors can read assigned students" on public.profiles;

create policy "Mentors can read assigned students"
  on public.profiles for select
  using (
    coalesce(
      nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
      nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
      ''
    ) = 'mentor'
  );

-- ── 6. Fix the recursive admin policy on profiles ──
drop policy if exists "Admins full access to profiles" on public.profiles;

create policy "Admins full access to profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 7. Fix admin policies on OTHER tables too.
--      These don't cause recursion (different table), but
--      they are inconsistent and fragile. ──

-- Sessions
drop policy if exists "Admins full access to sessions" on public.sessions;
create policy "Admins full access to sessions"
  on public.sessions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Goals
drop policy if exists "Admins full access to goals" on public.goals;
create policy "Admins full access to goals"
  on public.goals for all
  using (public.is_admin())
  with check (public.is_admin());

-- Tasks
drop policy if exists "Admins full access to tasks" on public.tasks;
create policy "Admins full access to tasks"
  on public.tasks for all
  using (public.is_admin())
  with check (public.is_admin());

-- Applications
drop policy if exists "Admins full access to applications" on public.applications;
create policy "Admins full access to applications"
  on public.applications for all
  using (public.is_admin())
  with check (public.is_admin());

-- Programs
drop policy if exists "Admins full access to programs" on public.programs;
create policy "Admins full access to programs"
  on public.programs for all
  using (public.is_admin())
  with check (public.is_admin());

-- Events
drop policy if exists "Admins full access to events" on public.events;
create policy "Admins full access to events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- Notifications
drop policy if exists "Admins full access to notifications" on public.notifications;
create policy "Admins full access to notifications"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());
