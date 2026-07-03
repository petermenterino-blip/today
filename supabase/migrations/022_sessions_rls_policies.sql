-- Sessions RLS policies (supplement to 999_rls.sql)
-- Re-assert all policies for completeness, add missing DELETE policy,
-- and add an auto-created_at trigger.

-- Ensure RLS is enabled (idempotent)
alter table public.sessions enable row level security;

-- ============================
-- SESSION RLS POLICIES
-- ============================

-- 1. Participants (mentor or student) can read sessions
drop policy if exists "Participants can read sessions" on public.sessions;
create policy "Participants can read sessions"
  on public.sessions for select
  using (student_id = auth.uid() or mentor_id = auth.uid());

-- 2. Mentors can insert sessions (where they are the mentor)
drop policy if exists "Mentors can insert sessions" on public.sessions;
create policy "Mentors can insert sessions"
  on public.sessions for insert
  with check (mentor_id = auth.uid());

-- 3. Mentors can update sessions (where they are the mentor)
drop policy if exists "Mentors can update sessions" on public.sessions;
create policy "Mentors can update sessions"
  on public.sessions for update
  using (mentor_id = auth.uid());

-- 4. Students can update attendance status (only their own sessions)
drop policy if exists "Students can update attendance" on public.sessions;
create policy "Students can update attendance"
  on public.sessions for update
  using (student_id = auth.uid());

-- 5. Mentors can delete sessions (where they are the mentor)
drop policy if exists "Mentors can delete sessions" on public.sessions;
create policy "Mentors can delete sessions"
  on public.sessions for delete
  using (mentor_id = auth.uid());

-- ============================
-- AUTO-UPDATE TRIGGER
-- ============================
-- Automatically set updated_at on row modification
create or replace function public.set_sessions_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sessions_updated_at on public.sessions;
create trigger trg_sessions_updated_at
  before update on public.sessions
  for each row
  execute function public.set_sessions_updated_at();
