-- Tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- Student-tag mapping
create table if not exists public.student_tags (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  unique(student_id, tag_id)
);

-- Resources
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  category text,
  is_pinned boolean default false,
  lesson_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Student progress
create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  lessons jsonb default '{}'::jsonb,
  unique(user_id, program_id)
);

-- Student timeline events
create table if not exists public.student_timeline_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('application_submitted', 'session_attended', 'goal_completed', 'task_submitted', 'milestone_achieved')),
  title text not null,
  description text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_timeline_student on public.student_timeline_events(student_id);

-- Mentor settings
create table if not exists public.mentor_settings (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade not null unique,
  timezone text default 'America/New_York',
  session_duration integer default 45,
  buffer_time integer default 15,
  notifications_enabled boolean default true,
  default_meeting_url text,
  working_days integer[] default '{1,2,3,4,5}',
  available_hours_start text default '09:00',
  available_hours_end text default '17:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dashboard layouts
create table if not exists public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  layout jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Custom forms
create table if not exists public.custom_forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  assigned_to jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Form templates
create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text check (type in ('weekly_checkin', 'reflection', 'feedback', 'session_prep', 'survey', 'program_review')),
  fields jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Form submissions
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.custom_forms(id) on delete cascade,
  template_id uuid references public.form_templates(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete set null,
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_user on public.form_submissions(user_id);
create index if not exists idx_form_submissions_form on public.form_submissions(form_id);

-- Shared files
create table if not exists public.shared_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text check (type in ('PDF', 'Resume', 'Portfolio', 'Figma', 'GitHub', 'Google Drive', 'Other')),
  category text,
  shared_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Mentor availability
create table if not exists public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products (store)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null default 0,
  image text,
  category text,
  sales_count integer default 0,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  amount numeric not null,
  product text,
  status text not null default 'pending' check (status in ('successful', 'failed', 'pending')),
  created_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  program_type text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- AI chat history
create table if not exists public.ai_chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_chat_user on public.ai_chat_history(user_id);

-- Surveys
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  feedback text,
  created_at timestamptz not null default now(),
  unique(survey_id, user_id)
);

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  properties jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_event on public.analytics_events(event_type);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);
