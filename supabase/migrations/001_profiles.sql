-- Profiles table (extends auth.users — FK handled by auth trigger)
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  name text,
  role text not null default 'student' check (role in ('student', 'mentor', 'admin')),
  avatar_url text,
  phone text,
  bio text,
  specialization text,
  current_status text,
  linkedin_url text,
  resume_link text,
  status text default 'active' check (status in ('applied', 'active', 'at_risk', 'completed', 'alumni')),
  health_status text default 'active' check (health_status in ('active', 'needs_attention', 'at_risk')),
  growth_score numeric default 0,
  goal_progress numeric default 0,
  notes text,
  last_login timestamptz,
  application_status text check (application_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- Student metrics (JSONB for flexibility)
alter table public.profiles add column if not exists metrics jsonb default '{"attendanceRate": 0, "goalCompletionRate": 0, "activityLevel": 0}'::jsonb;

-- Tags array
alter table public.profiles add column if not exists tags text[] default '{}';
