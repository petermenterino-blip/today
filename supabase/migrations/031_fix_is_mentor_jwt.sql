-- ============================================================
-- FINAL FIX: Eliminate RLS recursion on profiles table
-- Problem:
--   is_mentor() read from public.profiles, which triggered the
--   "Mentors can read assigned students" policy, which called
--   is_mentor() again → infinite recursion detected by PG >= 14.
--
-- Previous fix (999_fix_rls_recursion_v2) used plpgsql + security
-- definer, but PG 15+ can still flag this as potential recursion.
--
-- This fix:
--   1. Rewrites is_mentor() to read from the JWT claims ONLY.
--      It never touches the profiles table.
--   2. Adds a trigger to sync profiles.role → auth.users metadata
--      on every insert/update so the JWT is always authoritative.
--   3. Syncs existing mentor roles in a one-shot DO block.
--   4. Rewrites the profiles SELECT policy to use a direct JWT
--      check, completely removing any profiles-table dependency.
-- ============================================================

-- ── 1. Sync trigger: profiles.role → auth.users.raw_user_meta_data ──
-- This ensures the JWT (which is signed from raw_user_meta_data) is
-- authoritative and always reflects the latest role from profiles.
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

-- ── 2. One-shot sync for ALL existing profiles ──
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

-- ── 3. Rewrite is_mentor() — reads JWT claims, NEVER queries profiles ──
drop function if exists public.is_mentor() cascade;

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

-- ── 4. Rewrite the profiles SELECT policy — NO is_mentor() call ──
--     Use a direct JWT claim check to avoid ANY profile-table query.
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

-- ── 5. Also fix the inline profiles queries in other policies ──
--     These don't cause recursion (different tables), but being
--     consistent avoids future issues. We replace the inline
--     `exists (select 1 from profiles where id = auth.uid() and role = 'mentor')`
--     patterns with public.is_mentor() which now uses JWT.

-- Bookings
drop policy if exists "Mentors can read all bookings" on public.bookings;
create policy "Mentors can read all bookings"
  on public.bookings for select
  using (public.is_mentor());

drop policy if exists "Mentors can update bookings" on public.bookings;
create policy "Mentors can update bookings"
  on public.bookings for update
  using (public.is_mentor());

-- Events
drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (public.is_mentor());

-- Applications
drop policy if exists "Mentors can read all applications" on public.applications;
create policy "Mentors can read all applications"
  on public.applications for select
  using (public.is_mentor());

drop policy if exists "Mentors can update applications" on public.applications;
create policy "Mentors can update applications"
  on public.applications for update
  using (public.is_mentor());

-- Resources
drop policy if exists "Mentors can manage resources" on public.resources;
create policy "Mentors can manage resources"
  on public.resources for insert
  with check (public.is_mentor());

-- Custom forms
drop policy if exists "Mentors can read custom forms" on public.custom_forms;
create policy "Mentors can read custom forms"
  on public.custom_forms for select
  using (public.is_mentor());

drop policy if exists "Mentors can create custom forms" on public.custom_forms;
create policy "Mentors can create custom forms"
  on public.custom_forms for insert
  with check (public.is_mentor());

-- Form templates
drop policy if exists "Mentors can read form templates" on public.form_templates;
create policy "Mentors can read form templates"
  on public.form_templates for select
  using (public.is_mentor());

drop policy if exists "Mentors can create form templates" on public.form_templates;
create policy "Mentors can create form templates"
  on public.form_templates for insert
  with check (public.is_mentor());

-- Products
drop policy if exists "Mentors can insert products" on public.products;
create policy "Mentors can insert products"
  on public.products for insert
  with check (public.is_mentor());

-- Announcements
drop policy if exists "Mentors can create announcements" on public.announcements;
create policy "Mentors can create announcements"
  on public.announcements for insert
  with check (public.is_mentor());

-- Student tags
drop policy if exists "Mentors can manage student tags" on public.student_tags;
create policy "Mentors can manage student tags"
  on public.student_tags for insert
  with check (public.is_mentor());

-- Student timeline events
drop policy if exists "Mentors can create timeline events" on public.student_timeline_events;
create policy "Mentors can create timeline events"
  on public.student_timeline_events for insert
  with check (public.is_mentor());
