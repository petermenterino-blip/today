-- Module 5: Student CRM Complete Real-Time Implementation

-- 1. Form assignments table for proper delivery tracking
create table if not exists public.form_assignments (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.custom_forms(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'awaiting' check (status in ('awaiting', 'in_progress', 'submitted', 'reviewed', 'closed')),
  assigned_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  closed_at timestamptz,
  unique(form_id, student_id)
);

create index if not exists idx_form_assignments_student on public.form_assignments(student_id);
create index if not exists idx_form_assignments_form on public.form_assignments(form_id);

-- Enable realtime for form_assignments
alter publication supabase_realtime add table public.form_assignments;

-- 2. Add mentor_id to shared_files for notification routing
alter table public.shared_files add column if not exists mentor_id uuid references public.profiles(id) on delete set null;

-- 3. Add archived status to tasks
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check 
  check (status in ('pending', 'in_progress', 'submitted', 'completed', 'reviewed', 'approved', 'rejected', 'archived'));

-- 4. Add mentor_id and metadata to student_timeline_events
alter table public.student_timeline_events add column if not exists mentor_id uuid references public.profiles(id) on delete set null;
alter table public.student_timeline_events add column if not exists category text;
alter table public.student_timeline_events add column if not exists metadata jsonb default '{}'::jsonb;

-- 5. Extended timeline event types
alter table public.student_timeline_events drop constraint if exists student_timeline_events_type_check;
alter table public.student_timeline_events add constraint student_timeline_events_type_check 
  check (type in (
    'application_submitted', 'application_approved', 'program_assigned',
    'goal_created', 'goal_updated', 'goal_completed',
    'task_assigned', 'task_completed', 'task_updated',
    'form_sent', 'form_submitted',
    'session_scheduled', 'session_rescheduled', 'session_completed', 'session_cancelled',
    'file_shared',
    'credential_issued', 'credential_revoked',
    'mentor_note_added',
    'program_changed',
    'attendance_updated',
    'review_added',
    'student_login',
    'profile_updated',
    'milestone_achieved'
  ));

-- 6. Update notification type check to include more types
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check 
  check (type in ('session', 'task', 'goal', 'system', 'journal', 'review', 'announcement', 'event', 'form', 'file', 'credential'));

-- 7. Add mentor_id column to form_submissions for better tracking
alter table public.form_submissions add column if not exists mentor_id uuid references public.profiles(id) on delete set null;
alter table public.form_submissions add column if not exists status text default 'submitted' check (status in ('draft', 'submitted'));
alter table public.form_submissions add column if not exists updated_at timestamptz;

-- 8. Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;
