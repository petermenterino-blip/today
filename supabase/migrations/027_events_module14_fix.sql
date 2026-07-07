-- Module 14 Fix: Complete Events & Workshop Management System fixes
-- Fixes RLS, realtime, indexes, event_type constraint, performance

-- 1. Add event_type check constraint to events table
alter table public.events drop constraint if exists events_event_type_check;
alter table public.events add constraint events_event_type_check
  check (event_type in (
    'Workshop', 'Webinar', 'Bootcamp', 'AMA Session', 'Group Mentoring',
    'Networking Event', 'Office Hours', 'Interview Session', 'Career Talk',
    'Alumni Talk', 'Live Coding', 'Mock Interview', 'Hackathon', 'Assessment',
    'Guest Lecture', 'Community Meetup'
  ));

-- 2. Add left_early to attendance_status check
alter table public.event_attendees drop constraint if exists event_attendees_attendance_status_check;
alter table public.event_attendees add constraint event_attendees_attendance_status_check
  check (attendance_status in ('none', 'attended', 'absent', 'left_early'));

-- 3. Add checked_in, waitlist_position, bookmarked columns if missing
alter table public.event_attendees add column if not exists waitlist_position integer;
alter table public.event_attendees add column if not exists checked_in boolean default false;
alter table public.event_attendees add column if not exists checked_in_at timestamptz;
alter table public.event_attendees add column if not exists left_early boolean default false;
alter table public.event_attendees add column if not exists feedback_submitted boolean default false;
alter table public.event_attendees add column if not exists bookmarked boolean default false;

-- 4. Ensure event_files type check includes all needed types
alter table public.event_files drop constraint if exists event_files_type_check;
alter table public.event_files add constraint event_files_type_check
  check (type in ('slides', 'pdf', 'assignment', 'recording', 'resource', 'video', 'template', 'github', 'figma', 'googledrive'));

-- 5. Add indexes for performance
create index if not exists idx_events_date_status on public.events(date, status);
create index if not exists idx_events_created_at on public.events(created_at desc);
create index if not exists idx_attendees_event_status on public.event_attendees(event_id, registration_status);
create index if not exists idx_attendees_user_reg on public.event_attendees(user_id, event_id);
create index if not exists idx_event_files_event on public.event_files(event_id);
create index if not exists idx_event_feedbacks_event on public.event_feedbacks(event_id);
create index if not exists idx_event_recordings_event on public.event_recordings(event_id);

-- 6. Ensure all event tables are in realtime publication
do $$ begin alter publication supabase_realtime add table public.events; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_attendees; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_waitlist; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_activity; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_comments; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_speakers; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_feedbacks; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_files; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_notifications; exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_recordings; exception when sqlstate '42710' then null; end $$;

-- 7. RLS: Ensure all policies exist

-- Events table RLS
drop policy if exists "Students can read published events" on public.events;
create policy "Students can read published events"
  on public.events for select
  using (visibility = 'public' or created_by = auth.uid() or
    exists (select 1 from public.event_attendees where event_id = events.id and user_id = auth.uid()));

drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

drop policy if exists "Mentors can update own events" on public.events;
create policy "Mentors can update own events"
  on public.events for update
  using (created_by = auth.uid());

drop policy if exists "Mentors can delete own events" on public.events;
create policy "Mentors can delete own events"
  on public.events for delete
  using (created_by = auth.uid());

-- Event attendees RLS
drop policy if exists "Authenticated users can read event attendees" on public.event_attendees;
create policy "Authenticated users can read event attendees"
  on public.event_attendees for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can register for events" on public.event_attendees;
create policy "Users can register for events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

drop policy if exists "Event creators can update attendees" on public.event_attendees;
create policy "Event creators can update attendees"
  on public.event_attendees for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Users can cancel own registration" on public.event_attendees;
create policy "Users can cancel own registration"
  on public.event_attendees for update
  using (user_id = auth.uid());

drop policy if exists "Users can delete own registration" on public.event_attendees;
create policy "Users can delete own registration"
  on public.event_attendees for delete
  using (user_id = auth.uid());

drop policy if exists "Event creators can delete attendees" on public.event_attendees;
create policy "Event creators can delete attendees"
  on public.event_attendees for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event speakers RLS
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

-- Event waitlist RLS
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

-- Event activity RLS
drop policy if exists "Users can read event activity" on public.event_activity;
create policy "Users can read event activity"
  on public.event_activity for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can create event activity" on public.event_activity;
create policy "Users can create event activity"
  on public.event_activity for insert
  with check (auth.role() = 'authenticated');

-- Event comments RLS
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

-- Event notifications RLS
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

-- Event files RLS
drop policy if exists "Authenticated users can read event files" on public.event_files;
create policy "Authenticated users can read event files"
  on public.event_files for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert files" on public.event_files;
create policy "Event creators can insert files"
  on public.event_files for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can update files" on public.event_files;
create policy "Event creators can update files"
  on public.event_files for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can delete files" on public.event_files;
create policy "Event creators can delete files"
  on public.event_files for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event feedbacks RLS
drop policy if exists "Authenticated users can read event feedbacks" on public.event_feedbacks;
create policy "Authenticated users can read event feedbacks"
  on public.event_feedbacks for select
  using (auth.role() = 'authenticated');

drop policy if exists "Attendees can submit feedback" on public.event_feedbacks;
create policy "Attendees can submit feedback"
  on public.event_feedbacks for insert
  with check (exists (select 1 from public.event_attendees where event_id = event_feedbacks.event_id and user_id = auth.uid()));

-- Event recordings RLS
drop policy if exists "Authenticated users can read event recordings" on public.event_recordings;
create policy "Authenticated users can read event recordings"
  on public.event_recordings for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert recordings" on public.event_recordings;
create policy "Event creators can insert recordings"
  on public.event_recordings for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can update recordings" on public.event_recordings;
create policy "Event creators can update recordings"
  on public.event_recordings for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can delete recordings" on public.event_recordings;
create policy "Event creators can delete recordings"
  on public.event_recordings for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- 8. Function to get upcoming events with attendee count (fix existing)
-- Restricted to 'published' only to prevent draft event leaks
create or replace function public.get_upcoming_events()
returns table (
  id uuid,
  title text,
  date text,
  "time" text,
  event_type text,
  location text,
  capacity integer,
  attendee_count bigint,
  status text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    e.id,
    e.title,
    e.date,
    e.time,
    coalesce(e.event_type, e.category, 'Workshop'),
    e.location,
    e.capacity,
    (select count(*)::bigint from public.event_attendees ea where ea.event_id = e.id and ea.registration_status = 'confirmed'),
    e.status
  from public.events e
  where e.status = 'published'
    and (e.date::date >= current_date or (e.date::date = current_date and e.time >= to_char(now(), 'HH24:MI')))
  order by e.date, e.time;
$$;

-- 9. Create event_summary view for dashboard analytics
create or replace view public.event_summary as
select
  e.id,
  e.title,
  e.date,
  e.time,
  coalesce(e.event_type, e.category, 'Workshop') as event_type,
  e.status,
  e.capacity,
  e.featured,
  e.created_by,
  e.created_at,
  e.program_id,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id) as total_registrations,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id and ea.registration_status = 'confirmed') as confirmed_registrations,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id and ea.attendance_status = 'attended') as attended_count,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id and ea.attendance_status = 'absent') as absent_count,
  (select count(*)::int from public.event_waitlist ew where ew.event_id = e.id and ew.status = 'waiting') as waitlist_count,
  (select count(*)::int from public.event_feedbacks ef where ef.event_id = e.id) as feedback_count,
  coalesce((select avg(ef.rating)::numeric(3,2) from public.event_feedbacks ef where ef.event_id = e.id), 0) as avg_rating
from public.events e
where e.deleted_at is null;

-- 10. Enable RLS on views
alter view public.event_summary set (security_invoker = true);
