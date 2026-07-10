-- 045_fix_sessions_tasks_rls.sql
-- Fixes CRITICAL RLS gaps: sessions DELETE, tasks DELETE

-- ============================
-- 1. SESSIONS: Add missing DELETE policy
-- ============================
drop policy if exists "Mentors can delete sessions" on public.sessions;
create policy "Mentors can delete sessions"
  on public.sessions for delete
  using (mentor_id = auth.uid());

-- ============================
-- 2. TASKS: Add missing DELETE policy
-- ============================
drop policy if exists "Mentors can delete tasks" on public.tasks;
create policy "Mentors can delete tasks"
  on public.tasks for delete
  using (mentor_id = auth.uid());
