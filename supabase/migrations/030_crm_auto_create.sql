-- Module 3&4: Student CRM Auto-Creation & Complete Student Profiles
-- This migration ensures every student has a complete CRM automatically.

-- 1. Add mentor_id column to profiles if not exists
alter table public.profiles add column if not exists mentor_id uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists timezone text default 'UTC';
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists skills jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists social_links jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists invited_at timestamptz;
alter table public.profiles add column if not exists first_login_at timestamptz;
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists preferred_meeting_time text;
alter table public.profiles add column if not exists learning_objectives jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table public.profiles add column if not exists batch text;
alter table public.profiles add column if not exists cohort text;

create index if not exists idx_profiles_mentor_id on public.profiles(mentor_id);
create index if not exists idx_profiles_program_id on public.profiles(program_id);

-- 2. Extended timeline event types
ALTER TABLE public.student_timeline_events DROP CONSTRAINT IF EXISTS student_timeline_events_type_check;
ALTER TABLE public.student_timeline_events ADD CONSTRAINT student_timeline_events_type_check CHECK (type IN (
  'application_submitted', 'application_approved', 'application_rejected',
  'program_assigned', 'program_completed',
  'goal_created', 'goal_updated', 'goal_completed',
  'task_assigned', 'task_completed', 'task_updated',
  'form_sent', 'form_submitted',
  'session_scheduled', 'session_completed', 'session_cancelled',
  'file_shared', 'file_deleted',
  'milestone_achieved',
  'mentor_note', 'mentor_note_added',
  'credential_issued', 'credential_revoked',
  'student_login', 'student_logout',
  'profile_updated', 'onboarding_completed',
  'review_submitted', 'review_completed',
  'attendance_marked',
  'resource_shared',
  'certificate_issued',
  'phase_changed', 'module_completed'
));

-- 3. Add mentor_id and category columns to student_timeline_events if not exists
alter table public.student_timeline_events add column if not exists mentor_id uuid references public.profiles(id) on delete set null;
alter table public.student_timeline_events add column if not exists category text;
alter table public.student_timeline_events add column if not exists metadata jsonb default '{}'::jsonb;

-- 4. Function: auto-create full CRM when student profile is created
create or replace function public.handle_student_crm_creation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_program_id uuid;
begin
  -- Only for student role profiles
  if new.role = 'student' then
    -- Check if application exists for this email to link program_id
    select program_id into v_program_id
    from public.applications
    where email = new.email and (status = 'approved' or status = 'invited')
    limit 1;

    -- Update profile with program info from application if available
    if v_program_id is not null and new.program_id is null then
      update public.profiles set program_id = v_program_id where id = new.id;
    end if;

    -- Create student_progress if not exists
    insert into public.student_progress (user_id, program_id, started_at, lessons)
    select new.id, coalesce(v_program_id, new.program_id), now(), '{}'::jsonb
    where not exists (select 1 from public.student_progress where user_id = new.id);

    -- Create dashboard_layout if not exists
    insert into public.dashboard_layouts (user_id, layout)
    select new.id, '[]'::jsonb
    where not exists (select 1 from public.dashboard_layouts where user_id = new.id);

    -- Log welcome timeline event
    insert into public.student_timeline_events (student_id, type, title, description, timestamp, category)
    values (new.id, 'application_approved', 'CRM Auto-Initialized',
      'Student CRM was automatically created. Full profile and workspace initialized.',
      now(), 'system');
  end if;

  return new;
end;
$$;

-- 5. Trigger: auto-create CRM on student profile INSERT
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_student_crm_created') then
    create trigger on_student_crm_created
      after insert on public.profiles
      for each row
      execute function public.handle_student_crm_creation();
  end if;
end $$;

-- 6. Function: enrich CRM when student logs in
create or replace function public.handle_student_login()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.last_login is null and new.last_login is not null then
    -- First login detected
    update public.profiles set first_login_at = new.last_login where id = new.id;

    insert into public.student_timeline_events (student_id, type, title, description, timestamp, category)
    values (new.id, 'student_login', 'First Login',
      'Student logged in for the first time. Initial onboarding ready.',
      now(), 'activity');
  elsif new.last_login is distinct from old.last_login then
    insert into public.student_timeline_events (student_id, type, title, description, timestamp, category)
    values (new.id, 'student_login', 'Student Login',
      'Student logged into their account.',
      new.last_login, 'activity');
  end if;

  return new;
end;
$$;

-- 7. Trigger: track login events
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_student_login_track') then
    create trigger on_student_login_track
      after update of last_login on public.profiles
      for each row
      when (old.last_login is distinct from new.last_login)
      execute function public.handle_student_login();
  end if;
end $$;

-- 8. RLS policy for mentor read access to all students (not just via program_enrollments)
do $$ begin
  if exists (select 1 from pg_proc where proname = 'is_mentor') then
    drop policy if exists "Mentors can read all student profiles" on public.profiles;
    create policy "Mentors can read all student profiles"
      on public.profiles for select
      using (public.is_mentor());
  end if;
end $$;

-- 9. RLS policy for mentors to update student profiles
do $$ begin
  if exists (select 1 from pg_proc where proname = 'is_mentor') then
    drop policy if exists "Mentors can update all student profiles" on public.profiles;
    create policy "Mentors can update all student profiles"
      on public.profiles for update
      using (public.is_mentor());
  end if;
end $$;

-- 10. Enable realtime for profiles table
do $$ begin alter publication supabase_realtime add table public.profiles; exception when sqlstate '42710' then null; end $$;
