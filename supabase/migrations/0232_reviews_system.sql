-- Reviews System - Comprehensive review lifecycle

-- Main reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'assigned' check (status in (
    'draft', 'assigned', 'pending', 'submitted', 'in_review', 'completed', 'archived'
  )),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  rating integer check (rating >= 1 and rating <= 5),
  feedback text,
  mentor_notes text,
  mentor_response text,
  student_response text,
  tags jsonb default '[]'::jsonb,
  estimated_review_time integer,
  completion_percentage integer default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
  last_edited_at timestamptz,
  last_edited_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  source_type text check (source_type in ('task', 'journal', 'form', 'program_review', 'manual')),
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Review history for timeline tracking
create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status text not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_student on public.reviews(student_id);
create index if not exists idx_reviews_mentor on public.reviews(mentor_id);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_reviews_priority on public.reviews(priority);
create index if not exists idx_reviews_due_date on public.reviews(due_date);
create index if not exists idx_reviews_created on public.reviews(created_at desc);
create index if not exists idx_reviews_program on public.reviews(program_id);
create index if not exists idx_review_history_review on public.review_history(review_id);
create index if not exists idx_reviews_source on public.reviews(source_type, source_id);

-- Enable realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reviews') then
    alter publication supabase_realtime add table public.reviews;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'review_history') then
    alter publication supabase_realtime add table public.review_history;
  end if;
end $$;

-- Add 'review' type to notifications check constraint
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in ('session', 'task', 'goal', 'system', 'journal', 'review', 'announcement'));

-- Add review types to timeline events
alter table public.student_timeline_events drop constraint if exists student_timeline_events_type_check;
alter table public.student_timeline_events add constraint student_timeline_events_type_check check (type in (
  'application_submitted', 'application_approved', 'program_assigned',
  'goal_created', 'goal_completed',
  'task_assigned', 'task_completed', 'task_reviewed',
  'form_submitted', 'session_completed',
  'file_shared', 'milestone_achieved', 'mentor_note',
  'review_assigned', 'review_submitted', 'review_completed',
  'review_returned', 'review_archived'
));

-- RLS policies
alter table public.reviews enable row level security;
alter table public.review_history enable row level security;

-- Reviews RLS
drop policy if exists "Students can read own reviews" on public.reviews;
create policy "Students can read own reviews"
  on public.reviews for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read assigned reviews" on public.reviews;
create policy "Mentors can read assigned reviews"
  on public.reviews for select
  using (mentor_id = auth.uid() or exists (
    select 1 from public.programs where programs.id = reviews.program_id and programs.mentor_id = auth.uid()
  ));

drop policy if exists "Students can create reviews" on public.reviews;
create policy "Students can create reviews"
  on public.reviews for insert
  with check (student_id = auth.uid());

drop policy if exists "Mentors can create reviews" on public.reviews;
create policy "Mentors can create reviews"
  on public.reviews for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

drop policy if exists "Students can update own reviews" on public.reviews;
create policy "Students can update own reviews"
  on public.reviews for update
  using (student_id = auth.uid());

drop policy if exists "Mentors can update assigned reviews" on public.reviews;
create policy "Mentors can update assigned reviews"
  on public.reviews for update
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can delete reviews" on public.reviews;
create policy "Mentors can delete reviews"
  on public.reviews for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Review history RLS
drop policy if exists "Participants can read review history" on public.review_history;
create policy "Participants can read review history"
  on public.review_history for select
  using (exists (
    select 1 from public.reviews
    where reviews.id = review_history.review_id
    and (reviews.student_id = auth.uid() or reviews.mentor_id = auth.uid())
  ));

drop policy if exists "Participants can create review history" on public.review_history;
create policy "Participants can create review history"
  on public.review_history for insert
  with check (exists (
    select 1 from public.reviews
    where reviews.id = review_id
    and (reviews.student_id = auth.uid() or reviews.mentor_id = auth.uid())
  ));

-- Function to auto-create review history on status change
create or replace function public.handle_review_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.review_history (review_id, actor_id, from_status, to_status)
  values (new.id, auth.uid(), old.status, new.status);
  return new;
end;
$$;

drop trigger if exists trg_review_status_change on public.reviews;
create trigger trg_review_status_change
  after update of status on public.reviews
  for each row
  when (old.status is distinct from new.status)
  execute function public.handle_review_status_change();

-- Function to auto-update updated_at
create or replace function public.handle_review_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_review_updated_at on public.reviews;
create trigger trg_review_updated_at
  before update on public.reviews
  for each row
  execute function public.handle_review_updated_at();
