-- Tasks / Action Items table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'submitted', 'completed', 'reviewed', 'approved', 'rejected')),
  file_url text,
  feedback text,
  mentor_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_tasks_student on public.tasks(student_id);
create index if not exists idx_tasks_mentor on public.tasks(mentor_id);
create index if not exists idx_tasks_status on public.tasks(status);

-- TaskActivity growth fields (JSONB for flexibility)
alter table public.tasks add column if not exists growth_fields jsonb default '{}'::jsonb;
