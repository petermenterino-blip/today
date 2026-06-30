-- Journals table
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  type text not null default 'daily' check (type in ('daily', 'weekly', 'learning')),
  content text not null,
  mood text check (mood in ('great', 'good', 'okay', 'bad', 'terrible')),
  wins jsonb default '[]',
  challenges jsonb default '[]',
  mentor_comments jsonb default '[]',
  reviewed_by_mentor boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_journals_student on public.journals(student_id);
create index if not exists idx_journals_created on public.journals(created_at desc);
