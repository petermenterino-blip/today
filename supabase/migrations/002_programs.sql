-- Programs table
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  duration text,
  category text,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  image text,
  status text not null default 'draft' check (status in ('active', 'completed', 'not_started', 'draft', 'published')),
  visibility text default 'public' check (visibility in ('public', 'private')),
  progress numeric default 0,
  student_count integer default 0,
  max_students integer,
  outcomes jsonb default '[]',
  skills_covered jsonb default '[]',
  prerequisites jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_programs_mentor on public.programs(mentor_id);
create index if not exists idx_programs_status on public.programs(status);

-- Program enrollments
create table if not exists public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(program_id, student_id)
);

create index if not exists idx_enrollments_student on public.program_enrollments(student_id);
create index if not exists idx_enrollments_program on public.program_enrollments(program_id);
