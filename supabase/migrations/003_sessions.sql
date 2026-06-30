-- Sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text default 'America/New_York',
  meeting_url text,
  recording_url text,
  meeting_type text default 'Google Meet' check (meeting_type in ('Google Meet', 'Zoom', 'Offline')),
  session_type text,
  attendance_status text default 'pending' check (attendance_status in ('attended', 'missed', 'late', 'pending')),
  status text default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  notes text,
  internal_notes text,
  recurring_session boolean default false,
  reminder_time timestamptz,
  attached_files text,
  duration text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_sessions_mentor on public.sessions(mentor_id);
create index if not exists idx_sessions_student on public.sessions(student_id);
create index if not exists idx_sessions_start on public.sessions(start_time);
