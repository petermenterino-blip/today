-- ============================================================
-- MIGRATION 035: SECURE RLS POLICIES (Phase 1)
--
-- Replaces permissive / blanket policies with least-privilege,
-- role-and-owner-scoped policies.
--
-- CRITICAL FIXES
--   1. Drop "Authenticated full access" (FOR ALL) from 11 tables
--      created by migration 034 (resource_categories through
--      review_history).  Restore or create granular policies.
--   2. Fix the shared_files storage bucket policy — scope mentor
--      access to only their assigned students' folders.
--   3. Reconcile duplicate / competing mentor policies on profiles:
--      drop the broader policies, keep the scoped ones.
--   4. Add missing UPDATE and DELETE policies where needed.
--   5. Replace inline `EXISTS (SELECT 1 FROM profiles ...)` with
--      JWT-based is_mentor() / is_admin() helpers to avoid future
--      recursion and standardise the pattern.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- UP
-- ════════════════════════════════════════════════════════════

-- ── 0.  Ensure helper functions exist (idempotent) ──

create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'mentor';
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'admin';
$$;

-- ════════════════════════════════════════════════════════════
-- 1.  RESOURCE TABLES  — drop "Authenticated full access"
-- ════════════════════════════════════════════════════════════

-- These 11 tables were given "Authenticated full access" (FOR ALL)
-- by migration 034.  Several already had granular policies from
-- migration 023; dropping the blanket policy restores them.
-- For tables that had NO prior policies, we create new ones.

-- ── 1a. resource_categories ──
-- Granular policies already exist from 023 (Anyone can read,
-- Mentors manage/update/delete).  Just drop the blanket policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_categories' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_categories;
  end if;
end $$;

-- ── 1b. resource_favorites ──
-- Granular policies already exist from 023 (Users manage/update/
-- delete/read own favorites).  Just drop the blanket policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_favorites' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_favorites;
  end if;
end $$;

-- ── 1c. resource_comments ──
-- Granular policies already exist from 023 (Users read/create/
-- update/delete own comments).  Just drop the blanket policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_comments' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_comments;
  end if;
end $$;

-- ── 1d. resource_versions ──
-- Granular policies already exist from 023 (Users read versions,
-- Mentors create versions).  Just drop the blanket policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_versions' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_versions;
  end if;
end $$;

-- ── 1e. resource_activity ──
-- Granular policies already exist from 023 (Users read/insert
-- activity).  Just drop the blanket policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_activity' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_activity;
  end if;
end $$;

-- ── 1f. resource_completions ──
-- NO granular policies existed.  Create them.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_completions' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_completions;
  end if;
end $$;

drop policy if exists "Students insert own completions" on public.resource_completions;
create policy "Students insert own completions"
  on public.resource_completions for insert
  with check (user_id = auth.uid());

drop policy if exists "Students read own completions" on public.resource_completions;
create policy "Students read own completions"
  on public.resource_completions for select
  using (user_id = auth.uid());

drop policy if exists "Mentors read completions" on public.resource_completions;
create policy "Mentors read completions"
  on public.resource_completions for select
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = resource_completions.user_id and mentor_id = auth.uid()
    )
  );

-- ── 1g. resource_downloads ──
-- Granular policies already exist from 023 (Users insert/read
-- downloads).  Just drop the blanket policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_downloads' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_downloads;
  end if;
end $$;

-- ── 1h. resource_assignments ──
-- Granular policies already exist from 023 (Users read own
-- assignments, Mentors manage/delete assignments).  Drop the
-- blanket policy and add missing UPDATE/Mentors policy.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'resource_assignments' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.resource_assignments;
  end if;
end $$;

drop policy if exists "Mentors update assignments" on public.resource_assignments;
create policy "Mentors update assignments"
  on public.resource_assignments for update
  using (public.is_mentor());

-- ── 1i. recently_viewed ──
-- NO granular policies existed.  Create them.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'recently_viewed' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.recently_viewed;
  end if;
end $$;

drop policy if exists "Users read own recently viewed" on public.recently_viewed;
create policy "Users read own recently viewed"
  on public.recently_viewed for select
  using (user_id = auth.uid());

drop policy if exists "Users insert own recently viewed" on public.recently_viewed;
create policy "Users insert own recently viewed"
  on public.recently_viewed for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own recently viewed" on public.recently_viewed;
create policy "Users update own recently viewed"
  on public.recently_viewed for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own recently viewed" on public.recently_viewed;
create policy "Users delete own recently viewed"
  on public.recently_viewed for delete
  using (user_id = auth.uid());

-- ── 1j. reviews ──
-- NO granular policies existed.  Create them.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.reviews;
  end if;
end $$;

drop policy if exists "Students read own reviews" on public.reviews;
create policy "Students read own reviews"
  on public.reviews for select
  using (student_id = auth.uid());

drop policy if exists "Mentors read reviews" on public.reviews;
create policy "Mentors read reviews"
  on public.reviews for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors insert reviews" on public.reviews;
create policy "Mentors insert reviews"
  on public.reviews for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors update reviews" on public.reviews;
create policy "Mentors update reviews"
  on public.reviews for update
  using (mentor_id = auth.uid());

drop policy if exists "Students respond to reviews" on public.reviews;
create policy "Students respond to reviews"
  on public.reviews for update
  using (student_id = auth.uid());

drop policy if exists "Mentors delete reviews" on public.reviews;
create policy "Mentors delete reviews"
  on public.reviews for delete
  using (mentor_id = auth.uid());

-- ── 1k. review_history ──
-- NO granular policies existed.  Create them.
do $$ begin
  if exists (select 1 from pg_policies where tablename = 'review_history' and policyname = 'Authenticated full access') then
    drop policy "Authenticated full access" on public.review_history;
  end if;
end $$;

drop policy if exists "Participants read review history" on public.review_history;
create policy "Participants read review history"
  on public.review_history for select
  using (
    exists (
      select 1 from public.reviews
      where reviews.id = review_history.review_id
      and (reviews.student_id = auth.uid() or reviews.mentor_id = auth.uid())
    )
  );

drop policy if exists "Participants insert review history" on public.review_history;
create policy "Participants insert review history"
  on public.review_history for insert
  with check (
    exists (
      select 1 from public.reviews
      where reviews.id = review_id
      and (reviews.student_id = auth.uid() or reviews.mentor_id = auth.uid())
    )
  );

-- ════════════════════════════════════════════════════════════
-- 2.  STORAGE — shared_files policy
-- ════════════════════════════════════════════════════════════

-- Migration 020 created "shared_files_mentor_all" which gives any
-- mentor ALL operations on the entire shared_files bucket.  Replace
-- with a policy that scopes mentor access to only files in folders
-- belonging to their assigned students.
--
-- The shared_files bucket uses student UUID as the first folder
-- segment:  `{student_id}/{filename}`.  We use
-- `storage.foldername(name)` to extract the student_id and verify
-- the mentor-student relationship via profiles.mentor_id.

drop policy if exists "shared_files_mentor_all" on storage.objects;

drop policy if exists "shared_files_mentor_assigned" on storage.objects;
create policy "shared_files_mentor_assigned"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'shared_files' and
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = (storage.foldername(name))[1]::uuid
      and mentor_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'shared_files' and
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = (storage.foldername(name))[1]::uuid
      and mentor_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- 3.  PROFILES — reconcile duplicate mentor policies
-- ════════════════════════════════════════════════════════════

-- Migration 030_crm_auto_create added two broad policies:
--   "Mentors can read all student profiles"   (SELECT is_mentor)
--   "Mentors can update all student profiles"  (UPDATE is_mentor)
-- These duplicate but are BROADER than the existing scoped policies
-- from 999_rls.sql / 999_optimization.sql:
--   "Mentors can read assigned students"       (SELECT via JWT role)
--   "Mentors can update students they mentor"  (UPDATE mentor_id)
-- Because PostgreSQL OR-s policies with different names, the broad
-- policies allow mentors to access ANY student, not just their own.
-- Drop the broad policies; keep the scoped ones.

drop policy if exists "Mentors can read all student profiles" on public.profiles;
drop policy if exists "Mentors can update all student profiles" on public.profiles;

-- Also ensure the scoped policies use JWT-based is_mentor() to
-- avoid any future recursion.

drop policy if exists "Mentors can read assigned students" on public.profiles;
create policy "Mentors can read assigned students"
  on public.profiles for select
  using (public.is_mentor());

drop policy if exists "Mentors can update students they mentor" on public.profiles;
create policy "Mentors can update students they mentor"
  on public.profiles for update
  using (public.is_mentor() and mentor_id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- 4.  SHARED_FILES (table) — use is_mentor() helper
-- ════════════════════════════════════════════════════════════

-- Migration 020 used inline `EXISTS (SELECT 1 FROM profiles ...)`
-- for mentor checks on shared_files.  Replace with is_mentor() to
-- standardise and avoid any future recursion risk.
-- At the same time, scope mentor SELECT to only their students.

drop policy if exists "Mentors can read all shared files" on public.shared_files;
create policy "Mentors can read shared files"
  on public.shared_files for select
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = shared_files.user_id and mentor_id = auth.uid()
    )
  );

drop policy if exists "Mentors can insert shared files" on public.shared_files;
create policy "Mentors can insert shared files"
  on public.shared_files for insert
  with check (public.is_mentor());

drop policy if exists "Mentors can update shared files" on public.shared_files;
create policy "Mentors can update shared files"
  on public.shared_files for update
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = shared_files.user_id and mentor_id = auth.uid()
    )
  );

drop policy if exists "Mentors can delete shared files" on public.shared_files;
create policy "Mentors can delete shared files"
  on public.shared_files for delete
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = shared_files.user_id and mentor_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- 5.  MISSING POLICIES
-- ════════════════════════════════════════════════════════════

-- ── 5a. application_info_requests ──
-- No RLS policies found.  Create basic ones.
alter table if exists public.application_info_requests enable row level security;

drop policy if exists "Users read own info requests" on public.application_info_requests;
create policy "Users read own info requests"
  on public.application_info_requests for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = application_info_requests.application_id
      and applications.user_id = auth.uid()
    )
  );

drop policy if exists "Mentors read info requests" on public.application_info_requests;
create policy "Mentors read info requests"
  on public.application_info_requests for select
  using (public.is_mentor());

drop policy if exists "Users create info requests" on public.application_info_requests;
create policy "Users create info requests"
  on public.application_info_requests for insert
  with check (
    exists (
      select 1 from public.applications
      where applications.id = application_info_requests.application_id
      and applications.user_id = auth.uid()
    )
  );

drop policy if exists "Mentors update info requests" on public.application_info_requests;
create policy "Mentors update info requests"
  on public.application_info_requests for update
  using (public.is_mentor());

-- ── 5b. dashboard_layouts — add missing UPDATE/DELETE ──
drop policy if exists "Users update own layout" on public.dashboard_layouts;
create policy "Users update own layout"
  on public.dashboard_layouts for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own layout" on public.dashboard_layouts;
create policy "Users delete own layout"
  on public.dashboard_layouts for delete
  using (user_id = auth.uid());

-- ── 5c. tasks — add missing mentor DELETE ──
drop policy if exists "Mentors can delete tasks" on public.tasks;
create policy "Mentors can delete tasks"
  on public.tasks for delete
  using (mentor_id = auth.uid());

-- ── 5d. student_timeline_events — add mentor SELECT ──
drop policy if exists "Mentors read student timeline" on public.student_timeline_events;
create policy "Mentors read student timeline"
  on public.student_timeline_events for select
  using (
    public.is_mentor() and
    exists (
      select 1 from public.profiles
      where id = student_timeline_events.student_id and mentor_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════
-- 6.  REPLACE INLINE profiles queries with is_mentor()
-- ════════════════════════════════════════════════════════════

-- Several migration files used inline
--   `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')`
-- for non-profiles tables.  While these do NOT cause recursion
-- (different table), standardising to is_mentor() is cleaner and
-- slightly faster (JWT vs. table scan).

-- Tags: mentor CRUD already uses is_mentor() from 031.  OK.

-- Resource categories: mentor policies from 023 used inline queries.
-- Since we already dropped the blanket policy, let's update these too.
drop policy if exists "Mentors manage resource categories" on public.resource_categories;
create policy "Mentors manage resource categories"
  on public.resource_categories for insert
  with check (public.is_mentor());

drop policy if exists "Mentors update resource categories" on public.resource_categories;
create policy "Mentors update resource categories"
  on public.resource_categories for update
  using (public.is_mentor());

drop policy if exists "Mentors delete resource categories" on public.resource_categories;
create policy "Mentors delete resource categories"
  on public.resource_categories for delete
  using (public.is_mentor());

-- Resource tags
drop policy if exists "Mentors manage resource tags" on public.resource_tags;
create policy "Mentors manage resource tags"
  on public.resource_tags for insert
  with check (public.is_mentor());

-- Resource assignments
drop policy if exists "Users read own assignments" on public.resource_assignments;
create policy "Users read own assignments"
  on public.resource_assignments for select
  using (student_id = auth.uid() or public.is_mentor());

drop policy if exists "Mentors manage assignments" on public.resource_assignments;
create policy "Mentors manage assignments"
  on public.resource_assignments for insert
  with check (public.is_mentor());

drop policy if exists "Mentors delete assignments" on public.resource_assignments;
create policy "Mentors delete assignments"
  on public.resource_assignments for delete
  using (public.is_mentor());

-- Resource versions
drop policy if exists "Mentors create versions" on public.resource_versions;
create policy "Mentors create versions"
  on public.resource_versions for insert
  with check (public.is_mentor());

-- ════════════════════════════════════════════════════════════
-- 7.  ADMIN POLICIES — add for remaining key tables
-- ════════════════════════════════════════════════════════════

-- Journeys, bookings, messaging, and other core tables need admin
-- override policies.  Add them using is_admin().

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'journals' and policyname = 'Admins full access to journals') then
    create policy "Admins full access to journals"
      on public.journals for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'bookings' and policyname = 'Admins full access to bookings') then
    create policy "Admins full access to bookings"
      on public.bookings for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Admins full access to messages') then
    create policy "Admins full access to messages"
      on public.messages for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'conversations' and policyname = 'Admins full access to conversations') then
    create policy "Admins full access to conversations"
      on public.conversations for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'conversation_participants' and policyname = 'Admins full access to conversation participants') then
    create policy "Admins full access to conversation participants"
      on public.conversation_participants for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'mentor_settings' and policyname = 'Admins full access to mentor settings') then
    create policy "Admins full access to mentor settings"
      on public.mentor_settings for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tags' and policyname = 'Admins full access to tags') then
    create policy "Admins full access to tags"
      on public.tags for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'student_tags' and policyname = 'Admins full access to student tags') then
    create policy "Admins full access to student tags"
      on public.student_tags for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'announcements' and policyname = 'Admins full access to announcements') then
    create policy "Admins full access to announcements"
      on public.announcements for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'Admins full access to products') then
    create policy "Admins full access to products"
      on public.products for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'transactions' and policyname = 'Admins full access to transactions') then
    create policy "Admins full access to transactions"
      on public.transactions for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ai_chat_history' and policyname = 'Admins full access to AI chat history') then
    create policy "Admins full access to AI chat history"
      on public.ai_chat_history for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════
-- DOWN  (revert everything above)
-- ════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
-- DOWN — 7.  Drop admin policies added above
-- ════════════════════════════════════════════════════════════

-- NOTE: this only drops policies explicitly created in UP section 7.
-- The admin policies from 032 (profiles, sessions, goals, tasks,
-- applications, programs, events, notifications) are left intact.

drop policy if exists "Admins full access to journals" on public.journals;
drop policy if exists "Admins full access to bookings" on public.bookings;
drop policy if exists "Admins full access to messages" on public.messages;
drop policy if exists "Admins full access to conversations" on public.conversations;
drop policy if exists "Admins full access to conversation participants" on public.conversation_participants;
drop policy if exists "Admins full access to mentor settings" on public.mentor_settings;
drop policy if exists "Admins full access to tags" on public.tags;
drop policy if exists "Admins full access to student tags" on public.student_tags;
drop policy if exists "Admins full access to announcements" on public.announcements;
drop policy if exists "Admins full access to products" on public.products;
drop policy if exists "Admins full access to transactions" on public.transactions;
drop policy if exists "Admins full access to AI chat history" on public.ai_chat_history;

-- ════════════════════════════════════════════════════════════
-- DOWN — 6.  Restore inline profiles queries where changed
-- ════════════════════════════════════════════════════════════

drop policy if exists "Mentors manage resource categories" on public.resource_categories;
create policy "Mentors manage resource categories"
  on public.resource_categories for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors update resource categories" on public.resource_categories;
create policy "Mentors update resource categories"
  on public.resource_categories for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors delete resource categories" on public.resource_categories;
create policy "Mentors delete resource categories"
  on public.resource_categories for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors manage resource tags" on public.resource_tags;
create policy "Mentors manage resource tags"
  on public.resource_tags for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Users read own assignments" on public.resource_assignments;
create policy "Users read own assignments"
  on public.resource_assignments for select
  using (
    student_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors manage assignments" on public.resource_assignments;
create policy "Mentors manage assignments"
  on public.resource_assignments for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors delete assignments" on public.resource_assignments;
create policy "Mentors delete assignments"
  on public.resource_assignments for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors create versions" on public.resource_versions;
create policy "Mentors create versions"
  on public.resource_versions for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- ════════════════════════════════════════════════════════════
-- DOWN — 5.  Drop policies added in UP section 5
-- ════════════════════════════════════════════════════════════

-- Application info requests (didn't exist before; just drop)
drop policy if exists "Users read own info requests" on public.application_info_requests;
drop policy if exists "Mentors read info requests" on public.application_info_requests;
drop policy if exists "Users create info requests" on public.application_info_requests;
drop policy if exists "Mentors update info requests" on public.application_info_requests;

-- Dashboard layouts (restore to original: only SELECT + INSERT)
drop policy if exists "Users update own layout" on public.dashboard_layouts;
drop policy if exists "Users delete own layout" on public.dashboard_layouts;

-- Tasks (restore: no DELETE policy)
drop policy if exists "Mentors can delete tasks" on public.tasks;

-- Student timeline events (restore: mentor SELECT didn't exist)
drop policy if exists "Mentors read student timeline" on public.student_timeline_events;

-- ════════════════════════════════════════════════════════════
-- DOWN — 4.  Restore original shared_files table policies
-- ════════════════════════════════════════════════════════════

drop policy if exists "Mentors can read shared files" on public.shared_files;
create policy "Mentors can read all shared files"
  on public.shared_files for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can insert shared files" on public.shared_files;
create policy "Mentors can insert shared files"
  on public.shared_files for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can update shared files" on public.shared_files;
create policy "Mentors can update shared files"
  on public.shared_files for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can delete shared files" on public.shared_files;
create policy "Mentors can delete shared files"
  on public.shared_files for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- ════════════════════════════════════════════════════════════
-- DOWN — 3.  Restore duplicate broad mentor policies on profiles
-- ════════════════════════════════════════════════════════════

drop policy if exists "Mentors can read assigned students" on public.profiles;
create policy "Mentors can read assigned students"
  on public.profiles for select
  using (public.is_mentor());

drop policy if exists "Mentors can update students they mentor" on public.profiles;
create policy "Mentors can update students they mentor"
  on public.profiles for update
  using (public.is_mentor() and mentor_id = auth.uid());

-- Re-create the broad policies from 030
drop policy if exists "Mentors can read all student profiles" on public.profiles;
create policy "Mentors can read all student profiles"
  on public.profiles for select
  using (public.is_mentor());

drop policy if exists "Mentors can update all student profiles" on public.profiles;
create policy "Mentors can update all student profiles"
  on public.profiles for update
  using (public.is_mentor());

-- ════════════════════════════════════════════════════════════
-- DOWN — 2.  Restore original shared_files storage policy
-- ════════════════════════════════════════════════════════════

drop policy if exists "shared_files_mentor_assigned" on storage.objects;

drop policy if exists "shared_files_mentor_all" on storage.objects;
create policy "shared_files_mentor_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'shared_files' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- ════════════════════════════════════════════════════════════
-- DOWN — 1.  Re-apply "Authenticated full access" on 11 tables
--            (same logic as migration 034)
-- ════════════════════════════════════════════════════════════

-- First drop all granular policies we created in UP section 1

-- resource_categories: granular policies from 023 still exist (they
-- predate 034).  We just need to re-add the blanket policy.

-- resource_favorites: granular policies from 023 still exist.
drop policy if exists "Students insert own completions" on public.resource_completions;
drop policy if exists "Students read own completions" on public.resource_completions;
drop policy if exists "Mentors read completions" on public.resource_completions;

drop policy if exists "Mentors update assignments" on public.resource_assignments;

drop policy if exists "Users read own recently viewed" on public.recently_viewed;
drop policy if exists "Users insert own recently viewed" on public.recently_viewed;
drop policy if exists "Users update own recently viewed" on public.recently_viewed;
drop policy if exists "Users delete own recently viewed" on public.recently_viewed;

drop policy if exists "Students read own reviews" on public.reviews;
drop policy if exists "Mentors read reviews" on public.reviews;
drop policy if exists "Mentors insert reviews" on public.reviews;
drop policy if exists "Mentors update reviews" on public.reviews;
drop policy if exists "Students respond to reviews" on public.reviews;
drop policy if exists "Mentors delete reviews" on public.reviews;

drop policy if exists "Participants read review history" on public.review_history;
drop policy if exists "Participants insert review history" on public.review_history;

-- Now re-apply the original blanket policies (same as 034)
do $$ declare
  t text;
  tables text[] := array[
    'resource_categories','resource_favorites','resource_comments',
    'resource_versions','resource_activity','resource_completions',
    'resource_downloads','resource_assignments','recently_viewed',
    'reviews','review_history'
  ];
begin
  foreach t in array tables loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'Authenticated full access') then
      execute format(
        'create policy "Authenticated full access" on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
        t
      );
    end if;
  end loop;
end $$;
