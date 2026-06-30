-- Goals table
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  progress_percentage numeric default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'at_risk', 'completed')),
  blockers text,
  notes text,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_goals_student on public.goals(student_id);
create index if not exists idx_goals_status on public.goals(status);

-- Goal milestones
create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.goals(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_milestones_goal on public.goal_milestones(goal_id);
