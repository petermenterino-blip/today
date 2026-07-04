-- Module 14: Complete Events & Workshop Management System
-- Adds new tables, columns, indexes, RLS, and realtime for full event system

-- 1. ENHANCE EXISTING events TABLE
alter table public.events add column if not exists event_type text default 'Workshop';
alter table public.events add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table public.events add column if not exists agenda jsonb default '[]';
alter table public.events add column if not exists reminder_settings jsonb default '{"24h": true, "1h": true}';
alter table public.events add column if not exists meeting_platform text;
alter table public.events add column if not exists featured boolean default false;
alter table public.events add column if not exists archived boolean default false;
alter table public.events add column if not exists form_ids text[];
alter table public.events add column if not exists allow_registration_approval boolean default false;
alter table public.events add column if not exists notes text;

create index if not exists idx_events_event_type on public.events(event_type);
create index if not exists idx_events_created_by on public.events(created_by);
create index if not exists idx_events_featured on public.events(featured);
create index if not exists idx_events_archived on public.events(archived);
create index if not exists idx_events_program_id on public.events(program_id);

-- 2. ENHANCE event_attendees TABLE
alter table public.event_attendees add column if not exists waitlist_position integer;
alter table public.event_attendees add column if not exists waitlist_promoted_at timestamptz;
alter table public.event_attendees add column if not exists checked_in boolean default false;
alter table public.event_attendees add column if not exists checked_in_at timestamptz;
alter table public.event_attendees add column if not exists left_early boolean default false;
alter table public.event_attendees add column if not exists feedback_submitted boolean default false;
alter table public.event_attendees add column if not exists bookmarked boolean default false;

drop index if exists idx_attendees_event;
create index if not exists idx_attendees_event on public.event_attendees(event_id);
create index if not exists idx_attendees_user on public.event_attendees(user_id);
create index if not exists idx_attendees_waitlist on public.event_attendees(event_id, waitlist_position);

-- 3. EVENT SPEAKERS TABLE
create table if not exists public.event_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  title text,
  bio text,
  avatar_url text,
  linkedin_url text,
  company text,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_speakers_event on public.event_speakers(event_id);

-- 4. EVENT WAITLIST TABLE
create table if not exists public.event_waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  name text,
  email text,
  position integer not null,
  status text default 'waiting' check (status in ('waiting', 'promoted', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  promoted_at timestamptz,
  unique(event_id, user_id)
);

create index if not exists idx_event_waitlist_event on public.event_waitlist(event_id);
create index if not exists idx_event_waitlist_position on public.event_waitlist(event_id, position);

-- 5. EVENT ACTIVITY / TIMELINE TABLE
create table if not exists public.event_activity (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_event_activity_event on public.event_activity(event_id);
create index if not exists idx_event_activity_created on public.event_activity(created_at);

-- 6. EVENT COMMENTS / DISCUSSION TABLE
create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.event_comments(id) on delete cascade,
  content text not null,
  is_announcement boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_comments_event on public.event_comments(event_id);
create index if not exists idx_event_comments_parent on public.event_comments(parent_id);

-- 7. EVENT NOTIFICATIONS TRACKING
create table if not exists public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'new_event', 'registration_confirmed', 'registration_cancelled',
    'reminder_24h', 'reminder_1h', 'event_started',
    'event_cancelled', 'event_updated', 'waitlist_promoted',
    'attendance_recorded', 'feedback_request'
  )),
  sent_at timestamptz not null default now(),
  read boolean default false
);

create index if not exists idx_event_notifications_event on public.event_notifications(event_id);
create index if not exists idx_event_notifications_user on public.event_notifications(user_id);
create index if not exists idx_event_notifications_type on public.event_notifications(type);

-- 8. ENHANCE event_feedbacks TABLE
alter table public.event_feedbacks add column if not exists rating_breakdown jsonb;
alter table public.event_feedbacks add column if not exists would_recommend boolean;

-- 9. ENABLE REALTIME FOR ALL EVENT TABLES
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_attendees;
alter publication supabase_realtime add table public.event_waitlist;
alter publication supabase_realtime add table public.event_activity;
alter publication supabase_realtime add table public.event_comments;
alter publication supabase_realtime add table public.event_speakers;
alter publication supabase_realtime add table public.event_feedbacks;
alter publication supabase_realtime add table public.event_files;
alter publication supabase_realtime add table public.event_notifications;
alter publication supabase_realtime add table public.event_recordings;

-- 10. RLS POLICIES FOR NEW TABLES

-- Event speakers
alter table public.event_speakers enable row level security;
drop policy if exists "Anyone can read event speakers" on public.event_speakers;
create policy "Anyone can read event speakers"
  on public.event_speakers for select
  using (auth.role() = 'authenticated');
drop policy if exists "Event creators can manage speakers" on public.event_speakers;
create policy "Event creators can manage speakers"
  on public.event_speakers for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Event creators can update speakers" on public.event_speakers;
create policy "Event creators can update speakers"
  on public.event_speakers for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Event creators can delete speakers" on public.event_speakers;
create policy "Event creators can delete speakers"
  on public.event_speakers for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event waitlist
alter table public.event_waitlist enable row level security;
drop policy if exists "Users can read own waitlist" on public.event_waitlist;
create policy "Users can read own waitlist"
  on public.event_waitlist for select
  using (user_id = auth.uid());
drop policy if exists "Event creators can read waitlist" on public.event_waitlist;
create policy "Event creators can read waitlist"
  on public.event_waitlist for select
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Users can join waitlist" on public.event_waitlist;
create policy "Users can join waitlist"
  on public.event_waitlist for insert
  with check (user_id = auth.uid());
drop policy if exists "Users can cancel waitlist" on public.event_waitlist;
create policy "Users can cancel waitlist"
  on public.event_waitlist for update
  using (user_id = auth.uid());
drop policy if exists "Event creators can manage waitlist" on public.event_waitlist;
create policy "Event creators can manage waitlist"
  on public.event_waitlist for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Event creators can delete from waitlist" on public.event_waitlist;
create policy "Event creators can delete from waitlist"
  on public.event_waitlist for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event activity
alter table public.event_activity enable row level security;
drop policy if exists "Users can read event activity" on public.event_activity;
create policy "Users can read event activity"
  on public.event_activity for select
  using (auth.role() = 'authenticated');
drop policy if exists "Users can create event activity" on public.event_activity;
create policy "Users can create event activity"
  on public.event_activity for insert
  with check (auth.role() = 'authenticated');

-- Event comments
alter table public.event_comments enable row level security;
drop policy if exists "Users can read event comments" on public.event_comments;
create policy "Users can read event comments"
  on public.event_comments for select
  using (auth.role() = 'authenticated');
drop policy if exists "Users can create comments" on public.event_comments;
create policy "Users can create comments"
  on public.event_comments for insert
  with check (user_id = auth.uid());
drop policy if exists "Users can update own comments" on public.event_comments;
create policy "Users can update own comments"
  on public.event_comments for update
  using (user_id = auth.uid());
drop policy if exists "Users can delete own comments" on public.event_comments;
create policy "Users can delete own comments"
  on public.event_comments for delete
  using (user_id = auth.uid());

-- Event notifications
alter table public.event_notifications enable row level security;
drop policy if exists "Users can read own event notifications" on public.event_notifications;
create policy "Users can read own event notifications"
  on public.event_notifications for select
  using (user_id = auth.uid());
drop policy if exists "System can create event notifications" on public.event_notifications;
create policy "System can create event notifications"
  on public.event_notifications for insert
  with check (auth.role() = 'authenticated');
drop policy if exists "Users can update own event notifications" on public.event_notifications;
create policy "Users can update own event notifications"
  on public.event_notifications for update
  using (user_id = auth.uid());

-- 11. FIX EXISTING RLS FOR events TABLE - add DELETE policy
drop policy if exists "Mentors can delete own events" on public.events;
create policy "Mentors can delete own events"
  on public.events for delete
  using (created_by = auth.uid());

-- Add update for event_attendees - student can cancel own registration
drop policy if exists "Users can cancel own registration" on public.event_attendees;
create policy "Users can cancel own registration"
  on public.event_attendees for update
  using (user_id = auth.uid());
