-- ============================================================
-- MIGRATION 041: FIX COLUMN MISMATCH CAUSING POSTGREST 400s
--
-- Root cause: frontend queries reference columns that don't
-- exist in the database schema, producing HTTP 400 errors.
-- This migration adds ALL missing columns referenced by:
--   contextEngine.ts, useOverviewStore.ts, useAnalyticsBI.ts,
--   customFormService.ts
--
-- Tables affected: form_submissions, applications, goals,
--   sessions, resources, events, reviews, activity_logs
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. form_submissions — add user_name + created_at columns
-- ════════════════════════════════════════════════════════════
alter table public.form_submissions
  add column if not exists user_name text,
  add column if not exists created_at timestamptz not null default now();

-- ════════════════════════════════════════════════════════════
-- 2. applications — add student_id, assigned_mentor, name
-- ════════════════════════════════════════════════════════════
alter table public.applications
  add column if not exists student_id uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_mentor uuid references public.profiles(id) on delete set null,
  add column if not exists name text;

-- ════════════════════════════════════════════════════════════
-- 3. goals — add mentor_id column
-- ════════════════════════════════════════════════════════════
alter table public.goals
  add column if not exists mentor_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_goals_mentor on public.goals(mentor_id);

-- ════════════════════════════════════════════════════════════
-- 4. sessions — add scheduled_at column (used by contextEngine)
-- ════════════════════════════════════════════════════════════
alter table public.sessions
  add column if not exists scheduled_at timestamptz;

-- Keep scheduled_at in sync with start_time for existing rows
update public.sessions set scheduled_at = start_time where scheduled_at is null and start_time is not null;

-- ════════════════════════════════════════════════════════════
-- 5. resources — add uploaded_by column (alias for created_by)
-- ════════════════════════════════════════════════════════════
alter table public.resources
  add column if not exists uploaded_by uuid references public.profiles(id) on delete set null;

-- Sync uploaded_by from created_by for existing rows
update public.resources set uploaded_by = created_by where uploaded_by is null and created_by is not null;

-- ════════════════════════════════════════════════════════════
-- 6. events — add organizer_id, start_date, end_date columns
-- ════════════════════════════════════════════════════════════
alter table public.events
  add column if not exists organizer_id uuid references public.profiles(id) on delete set null,
  add column if not exists start_date text,
  add column if not exists end_date text;

-- Sync from existing columns
update public.events set organizer_id = created_by where organizer_id is null and created_by is not null;
update public.events set start_date = date where start_date is null and date is not null;
update public.events set end_date = end_time where end_date is null and end_time is not null;

create index if not exists idx_events_organizer on public.events(organizer_id);
create index if not exists idx_events_start_date on public.events(start_date);

-- ════════════════════════════════════════════════════════════
-- 7. reviews — add reviewee_id + scheduled_at columns
-- ════════════════════════════════════════════════════════════
alter table public.reviews
  add column if not exists reviewee_id uuid references public.profiles(id) on delete set null,
  add column if not exists scheduled_at timestamptz;

-- Sync reviewee_id from student_id for existing rows
update public.reviews set reviewee_id = student_id where reviewee_id is null and student_id is not null;
update public.reviews set scheduled_at = created_at where scheduled_at is null and created_at is not null;

create index if not exists idx_reviews_reviewee on public.reviews(reviewee_id);
create index if not exists idx_reviews_scheduled on public.reviews(scheduled_at);

-- ════════════════════════════════════════════════════════════
-- 8. Create activity_logs table (referenced by contextEngine)
-- ════════════════════════════════════════════════════════════
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_actor on public.activity_logs(actor_id);
create index if not exists idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);

-- Enable RLS
alter table public.activity_logs enable row level security;

-- RLS: users can read their own activity logs
drop policy if exists "Users read own activity logs" on public.activity_logs;
create policy "Users read own activity logs"
  on public.activity_logs for select
  using (actor_id = auth.uid());

-- RLS: mentors can read activity logs (for their students' dashboard)
drop policy if exists "Mentors read activity logs" on public.activity_logs;
create policy "Mentors read activity logs"
  on public.activity_logs for select
  using (public.is_mentor());

-- RLS: authenticated users can insert activity logs
drop policy if exists "Authenticated users insert activity logs" on public.activity_logs;
create policy "Authenticated users insert activity logs"
  on public.activity_logs for insert
  with check (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
-- 9. Add missing mentor SELECT policy for form_submissions
--    (mentors need to see their students' submissions)
-- ════════════════════════════════════════════════════════════
drop policy if exists "Mentors read submissions" on public.form_submissions;
create policy "Mentors read submissions"
  on public.form_submissions for select
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = form_submissions.user_id and mentor_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- 10. Add missing mentor SELECT policy for resource_views
--     (analytics BI queries this for mentor dashboard)
-- ════════════════════════════════════════════════════════════
drop policy if exists "Mentors read resource views" on public.resource_views;
create policy "Mentors read resource views"
  on public.resource_views for select
  using (public.is_mentor());

-- ════════════════════════════════════════════════════════════
-- 11. Add missing mentor SELECT policy for resource_downloads
-- ════════════════════════════════════════════════════════════
drop policy if exists "Mentors read resource downloads" on public.resource_downloads;
create policy "Mentors read resource downloads"
  on public.resource_downloads for select
  using (public.is_mentor());

-- ════════════════════════════════════════════════════════════
-- 12. Add missing mentor SELECT policy for resource_favorites
-- ════════════════════════════════════════════════════════════
drop policy if exists "Mentors read resource favorites" on public.resource_favorites;
create policy "Mentors read resource favorites"
  on public.resource_favorites for select
  using (public.is_mentor());

-- ════════════════════════════════════════════════════════════
-- 13. Add missing mentor SELECT policy for resource_completions
--     (already defined in 035, but ensure it exists)
-- ════════════════════════════════════════════════════════════
drop policy if exists "Mentors read completions" on public.resource_completions;
create policy "Mentors read completions"
  on public.resource_completions for select
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = resource_completions.user_id and mentor_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- 14. Add RLS for resource_views (was created with RLS disabled)
-- ════════════════════════════════════════════════════════════
alter table if exists public.resource_views enable row level security;
alter table if exists public.resource_downloads enable row level security;
alter table if exists public.resource_favorites enable row level security;

-- ════════════════════════════════════════════════════════════
-- 14. event_attendees — add status column (analytics BI query)
-- ════════════════════════════════════════════════════════════
alter table public.event_attendees
  add column if not exists status text;

-- Sync from registration_status for existing rows
update public.event_attendees set status = registration_status where status is null and registration_status is not null;

-- ════════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════
-- Add RLS policies for event_attendees mentor reads
-- (analytics BI queries all event_attendees without filters)
-- ════════════════════════════════════════════════════════════

-- Already enabled, but policy may need updating for mentor bulk reads
drop policy if exists "Mentors read all event attendees" on public.event_attendees;
create policy "Mentors read all event attendees"
  on public.event_attendees for select
  using (public.is_mentor());

-- ════════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════
-- Add RLS policies for review_history mentor reads
-- (analytics BI counts review_history rows)
-- ════════════════════════════════════════════════════════════

drop policy if exists "Mentors read review history" on public.review_history;
create policy "Mentors read review history"
  on public.review_history for select
  using (public.is_mentor());
