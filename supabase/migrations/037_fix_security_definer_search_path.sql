-- ============================================================
-- MIGRATION 037: Fix SECURITY DEFINER search_path
--
-- All SECURITY DEFINER functions must set an explicit search_path
-- to prevent privilege escalation via search_path injection.
-- This migration adds SET search_path = public to every
-- SECURITY DEFINER function that was missing it.
--
-- NOTE: is_mentor() and is_admin() are handled in 035 and 032
-- migrations directly; this file only fixes functions that are
-- NOT covered by those.
-- ============================================================

-- Trigger: auto-update updated_at on sessions
create or replace function public.set_sessions_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger: auto-update updated_at on gallery_items
create or replace function public.update_gallery_items_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Increment gallery view count
create or replace function public.increment_gallery_view_count(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gallery_items
  set view_count = view_count + 1
  where id = p_id;
end;
$$;

-- Gallery activity trigger
create or replace function public.log_gallery_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (new.id, 'created', new.created_by, jsonb_build_object('title', new.title));
  elsif tg_op = 'UPDATE' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (new.id, 'updated', auth.uid(), jsonb_build_object('diff', case
      when old.title <> new.title then jsonb_build_object('title', jsonb_build_array(old.title, new.title))
      else '{}'::jsonb
    end));
  elsif tg_op = 'DELETE' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (old.id, 'deleted', auth.uid(), jsonb_build_object('title', old.title));
  end if;
  return coalesce(new, old);
end;
$$;

-- Resource activity trigger
create or replace function public.log_resource_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.resource_activity (resource_id, user_id, action, details)
  values (
    new.id,
    coalesce(new.created_by, auth.uid()),
    'created',
    jsonb_build_object('title', new.title)
  );
  return new;
end;
$$;

-- Increment resource downloads
create or replace function public.increment_resource_downloads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resources
  set downloads_count = downloads_count + 1
  where id = new.resource_id;
  return new;
end;
$$;

-- Increment resource views
create or replace function public.increment_resource_views()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resources
  set views_count = views_count + 1
  where id = new.resource_id;
  return new;
end;
$$;

-- Auto-update updated_at on social_links
create or replace function public.update_social_links_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-update updated_at on website_settings
create or replace function public.update_website_settings_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Review status change history
create or replace function public.handle_review_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.review_history (review_id, actor_id, from_status, to_status)
  values (new.id, auth.uid(), old.status, new.status);
  return new;
end;
$$;

-- Review updated_at trigger
create or replace function public.handle_review_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Review growth score trigger
create or replace function public.handle_review_growth_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set growth_score = coalesce(growth_score, 0) + 5,
      updated_at = now()
  where id = new.student_id;
  return new;
end;
$$;

-- Resource completion trigger
create or replace function public.log_resource_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.resource_activity (resource_id, user_id, action, details)
  values (new.resource_id, new.user_id, 'completed', jsonb_build_object('completed_at', new.completed_at));
  return new;
end;
$$;

-- Increment resource completions
create or replace function public.increment_resource_completions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resources
  set completions_count = completions_count + 1
  where id = new.resource_id;
  return new;
end;
$$;

-- Provisioning jobs updated_at trigger
create or replace function public.handle_provisioning_jobs_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Insert notification with link parameter (MUST be called by system / service_role only)
-- This version adds search_path while keeping the SECURITY DEFINER for system use.
-- Regular users should use the 016_notification_rpc version which validates auth.uid().
create or replace function public.insert_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'system',
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, read, link)
  values (p_user_id, p_title, p_message, p_type, false, p_link);
end;
$$;
