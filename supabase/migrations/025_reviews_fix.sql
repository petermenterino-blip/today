-- Reviews System Fixes
-- 1. Add missing indexes for performance
-- 2. Update notification RPC to support links
-- 3. Add trigger to update growth_score on review completion

create index if not exists idx_reviews_deleted_at on public.reviews(deleted_at);
create index if not exists idx_reviews_completed_at on public.reviews(completed_at);
create index if not exists idx_reviews_mentor_status on public.reviews(mentor_id, status) where deleted_at is null;
create index if not exists idx_reviews_student_status on public.reviews(student_id, status) where deleted_at is null;

-- Update notification RPC to accept link
-- Restricted: p_user_id must equal auth.uid() (caller can only notify themselves)
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
  if p_user_id != auth.uid() then
    raise exception 'permission denied: you can only create notifications for yourself';
  end if;
  insert into public.notifications (user_id, title, message, type, read, link)
  values (p_user_id, p_title, p_message, p_type, false, p_link);
end;
$$;

-- Function to update growth_score when a review is completed
create or replace function public.handle_review_growth_score()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set growth_score = coalesce(growth_score, 0) + 5,
      updated_at = now()
  where id = new.student_id;
  return new;
end;
$$;

drop trigger if exists trg_review_growth_score on public.reviews;
create trigger trg_review_growth_score
  after update of status on public.reviews
  for each row
  when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function public.handle_review_growth_score();

-- Ensure reviews tables are in realtime publication
do $$ begin
  alter publication supabase_realtime add table public.reviews;
exception when sqlstate '42710' then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.review_history;
exception when sqlstate '42710' then null;
end $$;
