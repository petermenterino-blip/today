-- 044_fix_goals_missing_policies.sql
-- Fixes CRITICAL RLS gaps discovered during system integration testing.
--
-- Issues fixed:
-- 1. goals table had NO DELETE policy — all deletions silently failed
-- 2. goals table had NO mentor INSERT policy — mentors could not create goals
-- 3. dashboard_layouts had NO mentor INSERT policy — CRM init could fail
-- 4. profiles mentor UPDATE used program_enrollments join instead of direct mentor_id
-- 5. Fix any invalid reminder_time values (strings stored in timestamptz column)

-- ============================
-- 1. GOALS: Add missing DELETE policies
-- ============================
drop policy if exists "Students can delete own goals" on public.goals;
create policy "Students can delete own goals"
  on public.goals for delete
  using (student_id = auth.uid());

drop policy if exists "Mentors can delete students goals" on public.goals;
create policy "Mentors can delete students goals"
  on public.goals for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = goals.student_id and profiles.mentor_id = auth.uid()
    )
  );

-- ============================
-- 2. GOALS: Add missing mentor INSERT policy
-- ============================
drop policy if exists "Mentors can insert goals" on public.goals;
create policy "Mentors can insert goals"
  on public.goals for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = student_id and profiles.mentor_id = auth.uid()
    )
  );

-- ============================
-- 3. GOAL_MILESTONES: Add missing mentor UPDATE/DELETE policies
-- ============================
drop policy if exists "Mentors can update milestones" on public.goal_milestones;
create policy "Mentors can update milestones"
  on public.goal_milestones for update
  using (
    exists (
      select 1 from public.goals g
      join public.profiles p on g.student_id = p.id
      where g.id = goal_id and p.mentor_id = auth.uid()
    )
  );

drop policy if exists "Mentors can delete milestones" on public.goal_milestones;
create policy "Mentors can delete milestones"
  on public.goal_milestones for delete
  using (
    exists (
      select 1 from public.goals g
      join public.profiles p on g.student_id = p.id
      where g.id = goal_id and p.mentor_id = auth.uid()
    )
  );

-- ============================
-- 4. DASHBOARD_LAYOUTS: Add mentor INSERT policy (CRM init runs as mentor)
-- ============================
drop policy if exists "Mentors can insert student layouts" on public.dashboard_layouts;
create policy "Mentors can insert student layouts"
  on public.dashboard_layouts for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = user_id and profiles.mentor_id = auth.uid()
    )
  );

drop policy if exists "Mentors can update student layouts" on public.dashboard_layouts;
create policy "Mentors can update student layouts"
  on public.dashboard_layouts for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = user_id and profiles.mentor_id = auth.uid()
    )
  );

-- ============================
-- 5. PROFILES: Fix mentor UPDATE policy to use direct mentor_id
-- Old policy used program_enrollments → programs join which failed for
-- students not yet enrolled in a program (e.g., during CRM initialization).
-- ============================
drop policy if exists "Mentors can update students they mentor" on public.profiles;
create policy "Mentors can update students they mentor"
  on public.profiles for update
  using (
    mentor_id = auth.uid() or
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = profiles.id and pr.mentor_id = auth.uid()
    )
  );

-- ============================
-- 6. STUDENT_PROGRESS: Add mentor INSERT/UPDATE policies
-- ============================
drop policy if exists "Mentors can insert student progress" on public.student_progress;
create policy "Mentors can insert student progress"
  on public.student_progress for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = user_id and profiles.mentor_id = auth.uid()
    )
  );

drop policy if exists "Mentors can update student progress" on public.student_progress;
create policy "Mentors can update student progress"
  on public.student_progress for update
  using (
    exists (
      select 1 from public.programs
      where programs.id = student_progress.program_id and programs.mentor_id = auth.uid()
    )
  );

-- ============================
-- 7. STUDENT_TIMELINE_EVENTS: Fix mentor INSERT to allow assigned mentors
-- Old policy only checked role='mentor', not whether the mentor is assigned
-- ============================
drop policy if exists "Mentors can create timeline events" on public.student_timeline_events;
create policy "Mentors can create timeline events"
  on public.student_timeline_events for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = student_id and profiles.mentor_id = auth.uid()
    )
  );

-- ============================
-- 8. Fix invalid reminder_time values in sessions
-- The reminder_time column is timestamptz but some records may contain
-- string values like '1 hour before'. Clear them to null.
-- ============================
update public.sessions
set reminder_time = null
where reminder_time is not null
  and reminder_time::text !~ '^\d{4}-\d{2}-\d{2}T';

-- ============================
-- 9. STUDENT_TAGS: Add missing DELETE/UPDATE policies
-- ============================
drop policy if exists "Mentors can delete student tags" on public.student_tags;
create policy "Mentors can delete student tags"
  on public.student_tags for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can update student tags" on public.student_tags;
create policy "Mentors can update student tags"
  on public.student_tags for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );
