-- Security definer helper to insert notifications for any user
-- (bypasses RLS which restricts user_id = auth.uid())
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
  insert into public.notifications (user_id, title, message, type, read)
  values (p_user_id, p_title, p_message, p_type, false);
end;
$$;
