-- Security definer helper to insert notifications
-- Restricted: p_user_id must equal auth.uid() (caller can only notify themselves)
create or replace function public.insert_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id != auth.uid() then
    raise exception 'permission denied: you can only create notifications for yourself';
  end if;
  insert into public.notifications (user_id, title, message, type, read)
  values (p_user_id, p_title, p_message, p_type, false);
end;
$$;
