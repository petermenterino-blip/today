-- Program Management Enhancement Migration
-- Adds program_modules table and enhances programs/program_enrollments

-- 1. Enhance programs table
alter table public.programs add column if not exists short_description text;
alter table public.programs add column if not exists full_description text;
alter table public.programs add column if not exists thumbnail text;
alter table public.programs add column if not exists cover_banner text;
alter table public.programs add column if not exists tags jsonb default '[]'::jsonb;
alter table public.programs add column if not exists program_order integer default 0;
alter table public.programs add column if not exists learning_objectives jsonb default '[]'::jsonb;

-- Migrate outcomes data to learning_objectives if outcomes has data
update public.programs set learning_objectives = outcomes where outcomes is not null and outcomes != '[]'::jsonb and learning_objectives = '[]'::jsonb;

-- 2. Create program_modules table (normalized replacement for curriculum JSONB)
create table if not exists public.program_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade not null,
  title text not null,
  description text default '',
  module_order integer default 0,
  learning_outcomes jsonb default '[]'::jsonb,
  resources jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  videos jsonb default '[]'::jsonb,
  external_links jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_program_modules_program on public.program_modules(program_id);
create index if not exists idx_program_modules_order on public.program_modules(program_id, module_order);

-- 3. Enhance program_enrollments
alter table public.program_enrollments add column if not exists enrollment_status text default 'Assigned'
  check (enrollment_status in ('Assigned', 'Active', 'Completed', 'Paused'));

alter table public.program_enrollments add column if not exists start_date timestamptz;
alter table public.program_enrollments add column if not exists target_completion_date timestamptz;
alter table public.program_enrollments add column if not exists mentor_notes text;
alter table public.program_enrollments add column if not exists student_notes text;
alter table public.program_enrollments add column if not exists current_module_id uuid references public.program_modules(id) on delete set null;
alter table public.program_enrollments add column if not exists completed_modules integer default 0;
alter table public.program_enrollments add column if not exists remaining_modules integer default 0;
alter table public.program_enrollments add column if not exists percentage_complete numeric default 0;
alter table public.program_enrollments add column if not exists last_activity timestamptz;

-- Update existing active enrollments to use new enrollment_status
update public.program_enrollments set enrollment_status = 'Active' where enrollment_status = 'Assigned' and status = 'active';
update public.program_enrollments set enrollment_status = 'Completed' where status = 'completed';
update public.program_enrollments set enrollment_status = 'Active' where status = 'active' and enrollment_status = 'Assigned';

-- 4. Enable realtime for new tables
alter publication supabase_realtime add table public.program_modules;

-- 5. RLS policies for program_modules
alter table public.program_modules enable row level security;

create policy "Anyone can read published program modules"
  on public.program_modules for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_modules.program_id
      and programs.status = 'published'
      and programs.visibility = 'public'
    )
  );

create policy "Mentors can read their own program modules"
  on public.program_modules for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_modules.program_id
      and programs.mentor_id = auth.uid()
    )
  );

create policy "Mentors can insert their own program modules"
  on public.program_modules for insert
  with check (
    exists (
      select 1 from public.programs
      where programs.id = program_modules.program_id
      and programs.mentor_id = auth.uid()
    )
  );

create policy "Mentors can update their own program modules"
  on public.program_modules for update
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_modules.program_id
      and programs.mentor_id = auth.uid()
    )
  );

create policy "Mentors can delete their own program modules"
  on public.program_modules for delete
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_modules.program_id
      and programs.mentor_id = auth.uid()
    )
  );

-- 6. Students can read program_enrollments for themselves
drop policy if exists "Students can read own enrollments" on public.program_enrollments;
create policy "Students can read own enrollments"
  on public.program_enrollments for select
  using (student_id = auth.uid());

-- 7. Add updated_at trigger for program_modules
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_program_modules_updated_at
  before update on public.program_modules
  for each row
  execute function public.update_updated_at_column();
