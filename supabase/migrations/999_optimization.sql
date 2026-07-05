-- =============================================
-- Migration: 999_optimization.sql
-- Description: Performance indexes, optimized RLS policies,
--              and realtime publication cleanup for Mentorino
-- =============================================

-- =============================================
-- 1. PERFORMANCE INDEXES
-- =============================================
-- All use CREATE INDEX IF NOT EXISTS for idempotent re-runs.

-- 1a. profiles: composite index on (role, mentor_id) for mentee listing dashboards
create index if not exists idx_profiles_role_mentor
  on public.profiles(role, mentor_id);

-- 1b. profiles: covering index on (id, role) for auth lookups
create index if not exists idx_profiles_id_role
  on public.profiles(id, role);

-- 1c. sessions: composite index for mentor dashboard queries (uses start_time, not scheduled_at)
create index if not exists idx_sessions_mentor_start
  on public.sessions(mentor_id, start_time);

-- 1d. sessions: composite index for student detail view
create index if not exists idx_sessions_student_mentor
  on public.sessions(student_id, mentor_id);

-- 1e. messages: composite index for chat pagination (conversation_id, created_at DESC)
create index if not exists idx_messages_conv_created
  on public.messages(conversation_id, created_at desc);

-- 1f. messages: composite index for unread counts
create index if not exists idx_messages_conv_status
  on public.messages(conversation_id, status);

-- 1g. notifications: composite index for notification queries (user_id, read, created_at DESC)
create index if not exists idx_notifications_user_read_created
  on public.notifications(user_id, read, created_at desc);

-- 1h. tasks: composite index for task listing by student + status
create index if not exists idx_tasks_student_status
  on public.tasks(student_id, status);

-- 1i. goals: composite index for goal listing by student + status
create index if not exists idx_goals_student_status
  on public.goals(student_id, status);

-- 1j. journals: composite index for journal listing (student_id, created_at DESC)
create index if not exists idx_journals_student_created
  on public.journals(student_id, created_at desc);

-- 1k. applications: composite index on (user_id, status) for application review
create index if not exists idx_applications_user_status
  on public.applications(user_id, status);

-- 1l. events: composite index on (created_by, date) for event queries (organizer_id → created_by)
create index if not exists idx_events_created_by_date
  on public.events(created_by, date);

-- 1m. program_enrollments: composite index on (student_id, program_id) for enrollment lookups
create index if not exists idx_enrollments_student_program
  on public.program_enrollments(student_id, program_id);

-- 1n. resource_assignments: composite index on (student_id, resource_id) for resource queries
do $$ begin perform 1 from pg_tables where schemaname='public' and tablename='resource_assignments'; if found then execute 'create index if not exists idx_resource_assignments_student_resource on public.resource_assignments(student_id, resource_id)'; end if; exception when others then null; end $$;

-- 1o. conversation_participants: composite index on (user_id, conversation_id) for conversation lookups
create index if not exists idx_conv_parts_user_conv
  on public.conversation_participants(user_id, conversation_id);


-- =============================================
-- 2. OPTIMIZED RLS POLICIES
-- =============================================
-- Replace expensive multi-join subqueries with direct mentor_id lookups
-- and use the indexed public.is_mentor() helper consistently.

-- 2a. PROFILES — Mentor update: use direct mentor_id column instead of
--     program_enrollments → programs join
drop policy if exists "Mentors can update students they mentor" on public.profiles;
create policy "Mentors can update students they mentor"
  on public.profiles for update
  using (
    public.is_mentor() and profiles.mentor_id = auth.uid()
  );

-- 2b. GOALS — Mentor read: use mentor_id on profiles instead of complex join
drop policy if exists "Mentors can read students goals" on public.goals;
create policy "Mentors can read students goals"
  on public.goals for select
  using (
    exists (
      select 1 from public.profiles
      where id = goals.student_id and mentor_id = auth.uid()
    )
  );

-- 2c. GOALS — Mentor update: same optimization
drop policy if exists "Mentors can update students goals" on public.goals;
create policy "Mentors can update students goals"
  on public.goals for update
  using (
    exists (
      select 1 from public.profiles
      where id = goals.student_id and mentor_id = auth.uid()
    )
  );

-- 2d. JOURNALS — Mentor read: use direct mentor_id check
drop policy if exists "Mentors can read students journals" on public.journals;
create policy "Mentors can read students journals"
  on public.journals for select
  using (
    exists (
      select 1 from public.profiles
      where id = journals.student_id and mentor_id = auth.uid()
    )
  );

-- 2e. BOOKINGS — Mentor read: replace raw subquery with is_mentor() helper
drop policy if exists "Mentors can read all bookings" on public.bookings;
create policy "Mentors can read all bookings"
  on public.bookings for select
  using (public.is_mentor());

-- 2f. BOOKINGS — Mentor update: replace raw subquery with is_mentor() helper
drop policy if exists "Mentors can update bookings" on public.bookings;
create policy "Mentors can update bookings"
  on public.bookings for update
  using (public.is_mentor());

-- 2g. EVENTS — Mentor create: replace raw subquery with is_mentor() helper
drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (public.is_mentor());

-- 2h. APPLICATIONS — Mentor read: replace raw subquery with is_mentor() helper
drop policy if exists "Mentors can read all applications" on public.applications;
create policy "Mentors can read all applications"
  on public.applications for select
  using (public.is_mentor());

-- 2i. APPLICATIONS — Mentor update: replace raw subquery with is_mentor() helper
drop policy if exists "Mentors can update applications" on public.applications;
create policy "Mentors can update applications"
  on public.applications for update
  using (public.is_mentor());

-- 2j. RESOURCES — Mentor insert: replace raw subquery with is_mentor()
drop policy if exists "Mentors can manage resources" on public.resources;
create policy "Mentors can manage resources"
  on public.resources for insert
  with check (public.is_mentor());

-- 2k. RESOURCES — Mentor update: replace raw subquery with is_mentor()
drop policy if exists "Mentors can update resources" on public.resources;
create policy "Mentors can update resources"
  on public.resources for update
  using (public.is_mentor());

-- 2l. RESOURCES — Mentor delete: replace raw subquery with is_mentor()
drop policy if exists "Mentors can delete resources" on public.resources;
create policy "Mentors can delete resources"
  on public.resources for delete
  using (public.is_mentor());

-- 2m. CUSTOM FORMS — Mentor read: replace raw subquery with is_mentor()
drop policy if exists "Mentors can read custom forms" on public.custom_forms;
create policy "Mentors can read custom forms"
  on public.custom_forms for select
  using (public.is_mentor());

-- 2n. CUSTOM FORMS — Mentor create: replace raw subquery with is_mentor()
drop policy if exists "Mentors can create custom forms" on public.custom_forms;
create policy "Mentors can create custom forms"
  on public.custom_forms for insert
  with check (public.is_mentor());

-- 2o. FORM TEMPLATES — Mentor read: replace raw subquery with is_mentor()
drop policy if exists "Mentors can read form templates" on public.form_templates;
create policy "Mentors can read form templates"
  on public.form_templates for select
  using (public.is_mentor());

-- 2p. FORM TEMPLATES — Mentor create: replace raw subquery with is_mentor()
drop policy if exists "Mentors can create form templates" on public.form_templates;
create policy "Mentors can create form templates"
  on public.form_templates for insert
  with check (public.is_mentor());

-- 2q. MESSAGES — Optimize SELECT policy: add index hint for conversation_participants lookup
--     (the new idx_conv_parts_user_conv index accelerates this subquery)
drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- 2r. MESSAGES — Optimize INSERT policy: same index benefit
drop policy if exists "Participants can insert messages" on public.messages;
create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- 2s. MESSAGES — Optimize UPDATE status policy: same index benefit
drop policy if exists "Participants can update message status" on public.messages;
create policy "Participants can update message status"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- 2t. ADMIN — Allow admins full access to all tables
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to profiles') then
    create policy "Admins full access to profiles"
      on public.profiles for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to sessions') then
    create policy "Admins full access to sessions"
      on public.sessions for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to goals') then
    create policy "Admins full access to goals"
      on public.goals for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to tasks') then
    create policy "Admins full access to tasks"
      on public.tasks for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to applications') then
    create policy "Admins full access to applications"
      on public.applications for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to programs') then
    create policy "Admins full access to programs"
      on public.programs for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to events') then
    create policy "Admins full access to events"
      on public.events for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins full access to notifications') then
    create policy "Admins full access to notifications"
      on public.notifications for all
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;


-- =============================================
-- 3. REALTIME PUBLICATION OPTIMIZATIONS
-- Drop all tables from the realtime publication except essential ones.
-- Uses dynamic SQL with exception handling for idempotent re-runs.
do $$ declare t text; begin
  for t in select tablename::text from pg_tables where schemaname='public' and tablename not in ('messages','notifications','sessions','profiles')
  loop
    begin
      execute format('alter publication supabase_realtime drop table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;
-- Ensure essential tables are in the publication
do $$ begin execute 'alter publication supabase_realtime add table public.messages'; exception when others then null; end $$;
do $$ begin execute 'alter publication supabase_realtime add table public.notifications'; exception when others then null; end $$;
do $$ begin execute 'alter publication supabase_realtime add table public.sessions'; exception when others then null; end $$;
do $$ begin execute 'alter publication supabase_realtime add table public.profiles'; exception when others then null; end $$;
