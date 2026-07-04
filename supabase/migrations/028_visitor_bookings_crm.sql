-- CRM enhancements for visitor_bookings
-- Adds: new columns, statuses, booking_notes, booking_timeline, realtime, trigger, RLS, stats function

-- 1. Add new CRM columns to visitor_bookings
alter table public.visitor_bookings add column if not exists company text;
alter table public.visitor_bookings add column if not exists student_professional text;
alter table public.visitor_bookings add column if not exists preferred_mentor text;
alter table public.visitor_bookings add column if not exists program_of_interest text;
alter table public.visitor_bookings add column if not exists meeting_type text;
alter table public.visitor_bookings add column if not exists timezone text;
alter table public.visitor_bookings add column if not exists message text;
alter table public.visitor_bookings add column if not exists source_page text;
alter table public.visitor_bookings add column if not exists assigned_mentor_id uuid references public.profiles(id);
alter table public.visitor_bookings add column if not exists assigned_mentor_name text;
alter table public.visitor_bookings add column if not exists internal_notes text;
alter table public.visitor_bookings add column if not exists priority text default 'medium' check (priority in ('low', 'medium', 'high'));
alter table public.visitor_bookings add column if not exists deleted_at timestamptz;

-- 2. Change status check constraint to 8 statuses, default 'new'
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'visitor_bookings_status_check' and conrelid = 'public.visitor_bookings'::regclass) then
    alter table public.visitor_bookings drop constraint visitor_bookings_status_check;
  end if;
end $$;

alter table public.visitor_bookings alter column status set default 'new';
alter table public.visitor_bookings add constraint visitor_bookings_status_check
  check (status in ('new', 'contacted', 'awaiting_confirmation', 'scheduled', 'completed', 'cancelled', 'rejected', 'no_response'));

-- 3. Create booking_notes table for internal mentor notes
create table if not exists public.booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.visitor_bookings(id) on delete cascade,
  mentor_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- 4. Create booking_timeline table for communication history
create table if not exists public.booking_timeline (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.visitor_bookings(id) on delete cascade,
  action text not null,
  description text,
  metadata jsonb default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_booking_timeline_booking_created on public.booking_timeline(booking_id, created_at);

-- 5. Add to realtime publication
alter publication supabase_realtime add table if not exists public.visitor_bookings;
alter publication supabase_realtime add table if not exists public.booking_notes;
alter publication supabase_realtime add table if not exists public.booking_timeline;

-- 6. Create updated_at trigger for visitor_bookings (uses handle_updated_at from 900_auth_triggers)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_visitor_bookings_updated_at') then
    create trigger set_visitor_bookings_updated_at before update on public.visitor_bookings for each row execute function public.handle_updated_at();
  end if;
end $$;

-- 7. RLS policies

-- Enable RLS on new tables
alter table public.booking_notes enable row level security;
alter table public.booking_timeline enable row level security;

-- Visitor bookings: anyone can insert, mentors can select/update
drop policy if exists "Anyone can insert visitor bookings" on public.visitor_bookings;
create policy "Anyone can insert visitor bookings"
  on public.visitor_bookings for insert
  with check (true);

drop policy if exists "Mentors can read visitor bookings" on public.visitor_bookings;
create policy "Mentors can read visitor bookings"
  on public.visitor_bookings for select
  using (public.is_mentor());

drop policy if exists "Mentors can update visitor bookings" on public.visitor_bookings;
create policy "Mentors can update visitor bookings"
  on public.visitor_bookings for update
  using (public.is_mentor());

-- Booking notes: mentors can insert/select/update/delete, visitors cannot access
drop policy if exists "Mentors can insert booking notes" on public.booking_notes;
create policy "Mentors can insert booking notes"
  on public.booking_notes for insert
  with check (public.is_mentor());

drop policy if exists "Mentors can read booking notes" on public.booking_notes;
create policy "Mentors can read booking notes"
  on public.booking_notes for select
  using (public.is_mentor());

drop policy if exists "Mentors can update booking notes" on public.booking_notes;
create policy "Mentors can update booking notes"
  on public.booking_notes for update
  using (public.is_mentor());

drop policy if exists "Mentors can delete booking notes" on public.booking_notes;
create policy "Mentors can delete booking notes"
  on public.booking_notes for delete
  using (public.is_mentor());

-- Booking timeline: mentors can insert/select
drop policy if exists "Mentors can insert booking timeline" on public.booking_timeline;
create policy "Mentors can insert booking timeline"
  on public.booking_timeline for insert
  with check (public.is_mentor());

drop policy if exists "Mentors can read booking timeline" on public.booking_timeline;
create policy "Mentors can read booking timeline"
  on public.booking_timeline for select
  using (public.is_mentor());

-- 8. Create get_booking_stats() function
create or replace function public.get_booking_stats()
returns table (
  new_count bigint,
  contacted_count bigint,
  awaiting_count bigint,
  scheduled_count bigint,
  completed_count bigint,
  cancelled_count bigint,
  rejected_count bigint,
  no_response_count bigint,
  conversion_rate numeric,
  total_bookings bigint,
  today_count bigint,
  this_week_count bigint,
  this_month_count bigint
)
language sql
stable
as $$
  select
    coalesce(count(*) filter (where status = 'new'), 0) as new_count,
    coalesce(count(*) filter (where status = 'contacted'), 0) as contacted_count,
    coalesce(count(*) filter (where status = 'awaiting_confirmation'), 0) as awaiting_count,
    coalesce(count(*) filter (where status = 'scheduled'), 0) as scheduled_count,
    coalesce(count(*) filter (where status = 'completed'), 0) as completed_count,
    coalesce(count(*) filter (where status = 'cancelled'), 0) as cancelled_count,
    coalesce(count(*) filter (where status = 'rejected'), 0) as rejected_count,
    coalesce(count(*) filter (where status = 'no_response'), 0) as no_response_count,
    case when count(*) > 0 then
      round(100.0 * count(*) filter (where status = 'completed') / nullif(count(*), 0), 1)
    else 0 end as conversion_rate,
    count(*) as total_bookings,
    coalesce(count(*) filter (where created_at >= current_date), 0) as today_count,
    coalesce(count(*) filter (where created_at >= date_trunc('week', current_date)), 0) as this_week_count,
    coalesce(count(*) filter (where created_at >= date_trunc('month', current_date)), 0) as this_month_count
  from public.visitor_bookings
  where deleted_at is null;
$$;
