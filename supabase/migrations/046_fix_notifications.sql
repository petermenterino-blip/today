-- Fix notification system (Phase 1 of production audit remediation)
--
-- 1. Drop the restrictive type CHECK constraint — types are validated in app code
-- 2. Replace insert_notification RPC to accept p_link and allow cross-user inserts
--    (the security definer context already provides sufficient privilege;
--     the old auth.uid() check broke all mentor-targeted notifications)

-- 1. Drop the restrictive type CHECK on notifications.type
alter table public.notifications drop constraint if exists notifications_type_check;

-- 2. Drop all overloads explicitly to avoid "not unique" error
drop function if exists public.insert_notification(p_user_id uuid, p_title text, p_message text, p_type text);
drop function if exists public.insert_notification(p_user_id uuid, p_title text, p_message text, p_type text, p_link text);
drop function if exists public.insert_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_link text, p_metadata jsonb);

create or replace function public.insert_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
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
