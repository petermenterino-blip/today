-- Add modules, resources, assignments JSONB columns to programs
alter table public.programs
  add column if not exists modules jsonb default '[]',
  add column if not exists resources jsonb default '[]',
  add column if not exists assignments jsonb default '[]';

-- Program RLS policies
alter table public.programs enable row level security;

drop policy if exists "Mentors can read own programs" on public.programs;
create policy "Mentors can read own programs"
  on public.programs for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can insert programs" on public.programs;
create policy "Mentors can insert programs"
  on public.programs for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update own programs" on public.programs;
create policy "Mentors can update own programs"
  on public.programs for update
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can delete own programs" on public.programs;
create policy "Mentors can delete own programs"
  on public.programs for delete
  using (mentor_id = auth.uid());

-- Auto-update trigger for programs
create or replace function public.set_programs_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_programs_updated_at on public.programs;
create trigger trg_programs_updated_at
  before update on public.programs
  for each row
  execute function public.set_programs_updated_at();
