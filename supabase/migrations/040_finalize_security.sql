-- 040_finalize_security.sql
-- Fixes critical database issues found during production audit:
--   1. insert_notification() — re-add auth.uid() check (was removed in 037)
--   2. is_mentor() — ensure JWT-based version (9990 overwrote with SQL version)
--   3. resource_assignments — add missing UNIQUE constraint
--   4. sessions — drop duplicate BEFORE UPDATE trigger

-- =============================================================================
-- 1. Fix insert_notification: re-add auth.uid() check
-- Migration 037 removed the auth.uid() check, allowing any service_role context
-- to create notifications for any user. This restores the check.
-- =============================================================================
create or replace function public.insert_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure caller is either the recipient or using service_role
  if auth.uid() != p_user_id and current_setting('role', true) != 'service_role' then
    raise exception 'Not authorized to create notification for another user';
  end if;

  insert into notifications (user_id, type, title, message, link, metadata, created_at, read)
  values (p_user_id, p_type, p_title, p_message, p_link, p_metadata, now(), false);
end;
$$;

-- =============================================================================
-- 2. Fix is_mentor(): restore JWT-based version
-- Migration 9990 overwrote the JWT-based is_mentor() from 031/035 with a version
-- that queries profiles directly, which can cause RLS recursion on PG >= 14.
-- =============================================================================
create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'mentor'
  );
$$;

-- =============================================================================
-- 3. Fix resource_assignments: add UNIQUE constraint
-- Migration 0231 created the table without a unique constraint. Migration 034
-- tried to add it but used CREATE TABLE IF NOT EXISTS, which was a no-op.
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_assignments_resource_student_unique'
    and conrelid = 'resource_assignments'::regclass
  ) then
    alter table public.resource_assignments
      add constraint resource_assignments_resource_student_unique
      unique (resource_id, student_id);
  end if;
end;
$$;

-- =============================================================================
-- 4. Drop duplicate BEFORE UPDATE trigger on sessions
-- Both 900_auth_triggers and 022_sessions_rls_policies create BEFORE UPDATE
-- triggers on sessions that set updated_at = now(). Keep only the original
-- from 900 (set_sessions_updated_at / handle_updated_at).
-- =============================================================================
drop trigger if exists trg_sessions_updated_at on public.sessions;

-- =============================================================================
-- 5. Add missing FK index on gallery_items.created_by
-- =============================================================================
create index if not exists idx_gallery_items_created_by
  on public.gallery_items(created_by);
