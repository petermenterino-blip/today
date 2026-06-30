-- Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date text not null,
  time text,
  end_time text,
  timezone text default 'America/New_York',
  location text,
  meeting_link text,
  venue text,
  image text,
  cover_image text,
  capacity integer,
  registration_deadline text,
  speaker text,
  visibility text default 'public' check (visibility in ('public', 'private')),
  status text default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  tags text,
  category text,
  duration text,
  waitlist_limit integer,
  requirements text,
  resource_files text,
  event_color text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);

-- Event attendees
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  name text,
  email text,
  program text,
  registration_status text default 'confirmed' check (registration_status in ('confirmed', 'pending', 'cancelled')),
  attendance_status text default 'none' check (attendance_status in ('none', 'attended', 'absent')),
  registered_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create index if not exists idx_attendees_event on public.event_attendees(event_id);

-- Event files
create table if not exists public.event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text,
  type text check (type in ('slides', 'pdf', 'assignment', 'recording', 'resource')),
  url text not null,
  size text,
  uploaded_at timestamptz not null default now()
);

-- Event feedbacks
create table if not exists public.event_feedbacks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  student_name text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  suggestion text,
  created_at timestamptz not null default now()
);

-- Event recordings
create table if not exists public.event_recordings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  type text check (type in ('zoom', 'google_meet', 'youtube', 'other')),
  url text not null,
  notes text,
  created_at timestamptz not null default now()
);
