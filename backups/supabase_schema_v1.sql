-- Profiles table (extends auth.users — FK handled by auth trigger)
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  name text,
  role text not null default 'student' check (role in ('student', 'mentor', 'admin')),
  avatar_url text,
  phone text,
  bio text,
  specialization text,
  current_status text,
  linkedin_url text,
  resume_link text,
  status text default 'active' check (status in ('applied', 'active', 'at_risk', 'completed', 'alumni')),
  health_status text default 'active' check (health_status in ('active', 'needs_attention', 'at_risk')),
  growth_score numeric default 0,
  goal_progress numeric default 0,
  notes text,
  last_login timestamptz,
  application_status text check (application_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- Student metrics (JSONB for flexibility)
alter table public.profiles add column if not exists metrics jsonb default '{"attendanceRate": 0, "goalCompletionRate": 0, "activityLevel": 0}'::jsonb;

-- Tags array
alter table public.profiles add column if not exists tags text[] default '{}';

-- === End of 001_profiles.sql ===

-- Programs table
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  duration text,
  category text,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  image text,
  status text not null default 'draft' check (status in ('active', 'completed', 'not_started', 'draft', 'published')),
  visibility text default 'public' check (visibility in ('public', 'private')),
  progress numeric default 0,
  student_count integer default 0,
  max_students integer,
  outcomes jsonb default '[]',
  skills_covered jsonb default '[]',
  prerequisites jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_programs_mentor on public.programs(mentor_id);
create index if not exists idx_programs_status on public.programs(status);

-- Program enrollments
create table if not exists public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(program_id, student_id)
);

create index if not exists idx_enrollments_student on public.program_enrollments(student_id);
create index if not exists idx_enrollments_program on public.program_enrollments(program_id);

-- === End of 002_programs.sql ===

-- Sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text default 'America/New_York',
  meeting_url text,
  recording_url text,
  meeting_type text default 'Google Meet' check (meeting_type in ('Google Meet', 'Zoom', 'Offline')),
  session_type text,
  attendance_status text default 'pending' check (attendance_status in ('attended', 'missed', 'late', 'pending')),
  status text default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  notes text,
  internal_notes text,
  recurring_session boolean default false,
  reminder_time timestamptz,
  attached_files text,
  duration text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_sessions_mentor on public.sessions(mentor_id);
create index if not exists idx_sessions_student on public.sessions(student_id);
create index if not exists idx_sessions_start on public.sessions(start_time);

-- === End of 003_sessions.sql ===

-- Goals table
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  progress_percentage numeric default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'at_risk', 'completed')),
  blockers text,
  notes text,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_goals_student on public.goals(student_id);
create index if not exists idx_goals_status on public.goals(status);

-- Goal milestones
create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.goals(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_milestones_goal on public.goal_milestones(goal_id);

-- === End of 004_goals.sql ===

-- Tasks / Action Items table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'submitted', 'completed', 'reviewed', 'approved', 'rejected')),
  file_url text,
  feedback text,
  mentor_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_tasks_student on public.tasks(student_id);
create index if not exists idx_tasks_mentor on public.tasks(mentor_id);
create index if not exists idx_tasks_status on public.tasks(status);

-- TaskActivity growth fields (JSONB for flexibility)
alter table public.tasks add column if not exists growth_fields jsonb default '{}'::jsonb;

-- === End of 005_tasks.sql ===

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

-- === End of 006_journals.sql ===

-- Bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  user_name text,
  date text,
  time text,
  type text,
  status text not null default 'upcoming' check (status in ('confirmed', 'cancelled', 'upcoming', 'completed')),
  meeting_link text,
  notes text,
  attendance text check (attendance in ('present', 'absent', 'excused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_bookings_status on public.bookings(status);

-- === End of 007_bookings.sql ===

-- Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  mentor_id uuid references public.profiles(id) on delete set null not null,
  student_name text,
  is_group boolean default false,
  name text,
  description text,
  admin_id uuid references public.profiles(id) on delete set null,
  last_message text,
  last_message_time timestamptz,
  unread_count integer default 0,
  pinned boolean default false,
  archived boolean default false,
  participants uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_conv_mentor on public.conversations(mentor_id);
create index if not exists idx_conv_student on public.conversations(student_id);

-- Conversation participants
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create index if not exists idx_conv_parts_user on public.conversation_participants(user_id);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  content text not null,
  type text not null default 'text' check (type in ('text', 'image', 'file', 'voice', 'system')),
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  audio_url text,
  duration numeric,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- Ensure columns exist if table was created before this migration
alter table public.conversations add column if not exists participants uuid[] default '{}';
alter table public.messages add column if not exists sender_name text;

-- === End of 008_messages.sql ===

-- Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date text not null,
  time text,
  end_time text,
  timezone text default 'America/New_York',
  location text,
  meeting_link text,
  venue text,
  image text,
  cover_image text,
  capacity integer,
  registration_deadline text,
  speaker text,
  visibility text default 'public' check (visibility in ('public', 'private')),
  status text default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  tags text,
  category text,
  duration text,
  waitlist_limit integer,
  requirements text,
  resource_files text,
  event_color text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);

-- Event attendees
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  name text,
  email text,
  program text,
  registration_status text default 'confirmed' check (registration_status in ('confirmed', 'pending', 'cancelled')),
  attendance_status text default 'none' check (attendance_status in ('none', 'attended', 'absent')),
  registered_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create index if not exists idx_attendees_event on public.event_attendees(event_id);

-- Event files
create table if not exists public.event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text,
  type text check (type in ('slides', 'pdf', 'assignment', 'recording', 'resource')),
  url text not null,
  size text,
  uploaded_at timestamptz not null default now()
);

-- Event feedbacks
create table if not exists public.event_feedbacks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  student_name text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  suggestion text,
  created_at timestamptz not null default now()
);

-- Event recordings
create table if not exists public.event_recordings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  type text check (type in ('zoom', 'google_meet', 'youtube', 'other')),
  url text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- === End of 009_events.sql ===

-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone_number text,
  discipline text,
  reason_for_applying jsonb,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'more_info_needed', 'invited')),
  mentor_type text,
  meeting_preference text check (meeting_preference in ('Virtual', 'In-Person', 'Hybrid')),
  frequency text,
  seriousness integer check (seriousness >= 1 and seriousness <= 10),
  location text,
  focus_area text,
  program_id uuid references public.programs(id) on delete set null,
  role_selected text,
  top_strength text,
  needs_focus text,
  mentor_notes text,
  rejection_reason text,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_applications_user on public.applications(user_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_email on public.applications(email);

-- Application notes
create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Application info requests (for more_info_needed flow)
create table if not exists public.application_info_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade not null,
  requested_info text not null,
  response text,
  status text default 'pending' check (status in ('pending', 'responded')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- === End of 010_applications.sql ===

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  read boolean default false,
  type text not null default 'system' check (type in ('session', 'task', 'goal', 'system', 'journal')),
  link text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- === End of 011_notifications.sql ===

-- Tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- Student-tag mapping
create table if not exists public.student_tags (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  unique(student_id, tag_id)
);

-- Resources
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  category text,
  is_pinned boolean default false,
  lesson_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Student progress
create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  lessons jsonb default '{}'::jsonb,
  unique(user_id, program_id)
);

-- Student timeline events
create table if not exists public.student_timeline_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('application_submitted', 'session_attended', 'goal_completed', 'task_submitted', 'milestone_achieved')),
  title text not null,
  description text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_timeline_student on public.student_timeline_events(student_id);

-- Mentor settings
create table if not exists public.mentor_settings (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade not null unique,
  timezone text default 'America/New_York',
  session_duration integer default 45,
  buffer_time integer default 15,
  notifications_enabled boolean default true,
  default_meeting_url text,
  working_days integer[] default '{1,2,3,4,5}',
  available_hours_start text default '09:00',
  available_hours_end text default '17:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dashboard layouts
create table if not exists public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  layout jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Custom forms
create table if not exists public.custom_forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  assigned_to jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Form templates
create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text check (type in ('weekly_checkin', 'reflection', 'feedback', 'session_prep', 'survey', 'program_review')),
  fields jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Form submissions
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.custom_forms(id) on delete cascade,
  template_id uuid references public.form_templates(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete set null,
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_user on public.form_submissions(user_id);
create index if not exists idx_form_submissions_form on public.form_submissions(form_id);

-- Shared files
create table if not exists public.shared_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text check (type in ('PDF', 'Resume', 'Portfolio', 'Figma', 'GitHub', 'Google Drive', 'Other')),
  category text,
  shared_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Mentor availability
create table if not exists public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products (store)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null default 0,
  image text,
  category text,
  sales_count integer default 0,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  amount numeric not null,
  product text,
  status text not null default 'pending' check (status in ('successful', 'failed', 'pending')),
  created_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  program_type text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- AI chat history
create table if not exists public.ai_chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_chat_user on public.ai_chat_history(user_id);

-- Surveys
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  feedback text,
  created_at timestamptz not null default now(),
  unique(survey_id, user_id)
);

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  properties jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_event on public.analytics_events(event_type);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);

-- === End of 012_supplementary.sql ===

-- Profile extras for frontend settings
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists settings jsonb default '{}'::jsonb;

-- === End of 013_profile_extras.sql ===

-- Storage buckets for Mentorino
-- Run this via Supabase dashboard SQL editor or supabase CLI

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-avatars', 'profile-avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('student-documents', 'student-documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']),
  ('mentor-resources', 'mentor-resources', false, 52428800, ARRAY['application/pdf', 'application/zip', 'video/mp4', 'image/png', 'image/jpeg', 'image/webp']),
  ('gallery-images', 'gallery-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Profile avatars: public read, owner write
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-avatars');
CREATE POLICY "avatars_owner_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Student documents: student write own, mentor read assigned
CREATE POLICY "docs_student_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "docs_student_read_own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "docs_mentor_read_assigned" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'student-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'mentor'
  ) AND
  EXISTS (
    SELECT 1 FROM public.program_enrollments pe
    JOIN public.programs pr ON pe.program_id = pr.id
    WHERE pr.mentor_id = auth.uid()
    AND pe.student_id::text = (storage.foldername(name))[1]
  )
);
CREATE POLICY "docs_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Mentor resources: mentor write, all authenticated read
CREATE POLICY "resources_mentor_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mentor-resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "resources_mentor_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'mentor-resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "resources_mentor_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mentor-resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "resources_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'mentor-resources');

-- Gallery images: public read, mentor write
CREATE POLICY "gallery_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'gallery-images');
CREATE POLICY "gallery_mentor_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "gallery_mentor_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));

-- === End of 014_storage.sql ===

-- Enable Realtime on tables for live subscriptions
-- Messages: new message notifications
-- Notifications: real-time badge updates
-- Sessions: status changes (scheduled → completed/cancelled)

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.bookings;

-- === End of 015_realtime.sql ===

-- Security definer helper to insert notifications for any user
-- (bypasses RLS which restricts user_id = auth.uid())
create or replace function public.insert_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, read)
  values (p_user_id, p_title, p_message, p_type, false);
end;
$$;

-- === End of 016_notification_rpc.sql ===

-- Allow anonymous users to upload documents for applications
-- Visitors (not authenticated) need to be able to upload resumes
-- The folder prefix 'applications/' is used for visitor submissions

CREATE POLICY "docs_anon_upload_applications" 
  ON storage.objects 
  FOR INSERT 
  TO public 
  WITH CHECK (
    bucket_id = 'student-documents' 
    AND (storage.foldername(name))[1] = 'applications'
  );

CREATE POLICY "docs_anon_read_applications" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (
    bucket_id = 'student-documents' 
    AND (storage.foldername(name))[1] = 'applications'
  );

-- === End of 017_public_storage.sql ===

-- Visitor bookings table (no auth required)
create table if not exists public.visitor_bookings (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text,
  call_type text not null check (call_type in ('intro', 'rapid')),
  date text not null,
  time text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visitor_bookings_date on public.visitor_bookings(date);
create index if not exists idx_visitor_bookings_status on public.visitor_bookings(status);

-- RLS: anyone can insert
alter table public.visitor_bookings enable row level security;

drop policy if exists "Anyone can insert visitor bookings" on public.visitor_bookings;
create policy "Anyone can insert visitor bookings"
  on public.visitor_bookings for insert
  with check (true);

-- Mentors can read all visitor bookings
drop policy if exists "Mentors can read visitor bookings" on public.visitor_bookings;
create policy "Mentors can read visitor bookings"
  on public.visitor_bookings for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Mentors can update visitor bookings
drop policy if exists "Mentors can update visitor bookings" on public.visitor_bookings;
create policy "Mentors can update visitor bookings"
  on public.visitor_bookings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- === End of 018_visitor_bookings.sql ===

-- Module 6: Student CRM Functional Completion
-- Extended timeline event types
ALTER TABLE public.student_timeline_events 
DROP CONSTRAINT IF EXISTS student_timeline_events_type_check;

ALTER TABLE public.student_timeline_events 
ADD CONSTRAINT student_timeline_events_type_check 
CHECK (type IN (
  'application_submitted', 'application_approved', 'program_assigned',
  'goal_created', 'goal_completed',
  'task_assigned', 'task_completed',
  'form_submitted', 'session_completed',
  'file_shared', 'milestone_achieved', 'mentor_note'
));

-- Create shared_files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared_files',
  'shared_files',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Shared files RLS policies
DROP POLICY IF EXISTS "shared_files_mentor_all" ON storage.objects;
CREATE POLICY "shared_files_mentor_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'shared_files' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "shared_files_student_read" ON storage.objects;
CREATE POLICY "shared_files_student_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'shared_files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS for shared_files table
DROP POLICY IF EXISTS "Mentors can read all shared files" ON public.shared_files;
CREATE POLICY "Mentors can read all shared files"
  ON public.shared_files FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "Mentors can insert shared files" ON public.shared_files;
CREATE POLICY "Mentors can insert shared files"
  ON public.shared_files FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "Mentors can update shared files" ON public.shared_files;
CREATE POLICY "Mentors can update shared files"
  ON public.shared_files FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "Mentors can delete shared files" ON public.shared_files;
CREATE POLICY "Mentors can delete shared files"
  ON public.shared_files FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

-- Students can read shared files assigned to them
DROP POLICY IF EXISTS "Students can read own shared files" ON public.shared_files;
CREATE POLICY "Students can read own shared files"
  ON public.shared_files FOR SELECT
  USING (user_id = auth.uid());

-- Tags: allow mentors full CRUD
DROP POLICY IF EXISTS "Mentors can insert tags" ON public.tags;
CREATE POLICY "Mentors can insert tags"
  ON public.tags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "Mentors can update tags" ON public.tags;
CREATE POLICY "Mentors can update tags"
  ON public.tags FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "Mentors can delete tags" ON public.tags;
CREATE POLICY "Mentors can delete tags"
  ON public.tags FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );

-- Add storage_path and size columns to shared_files if they don't exist
ALTER TABLE public.shared_files 
ADD COLUMN IF NOT EXISTS storage_path text NOT NULL DEFAULT '';

ALTER TABLE public.shared_files 
ADD COLUMN IF NOT EXISTS size bigint NOT NULL DEFAULT 0;

-- Enable realtime for all module 6 tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_forms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_timeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- === End of 020_module6_complete.sql ===

-- Module 12: Program Progress Performance, Real-Time & Student Drill-Down
-- Indexes for fast progress lookups
CREATE INDEX IF NOT EXISTS idx_student_progress_user_program ON public.student_progress(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON public.student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_program ON public.student_progress(program_id);

-- Indexes for enrollment queries
CREATE INDEX IF NOT EXISTS idx_program_enrollments_student ON public.program_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON public.program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON public.program_enrollments(status);

-- Indexes for session lookups in side panel
CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON public.sessions(mentor_id);

-- Indexes for task queries
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);

-- Indexes for goal queries
CREATE INDEX IF NOT EXISTS idx_goals_student ON public.goals(student_id);

-- Enable realtime for student_progress (auto-update progress table)
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_progress;

-- Enable realtime for program_enrollments (auto-update enrollment changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.program_enrollments;

-- === End of 021_module12_complete.sql ===

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

-- === End of 022_sessions_rls_policies.sql ===

-- Module 14: Complete Events & Workshop Management System
-- Adds new tables, columns, indexes, RLS, and realtime for full event system

-- 1. ENHANCE EXISTING events TABLE
alter table public.events add column if not exists event_type text default 'Workshop';
alter table public.events add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table public.events add column if not exists agenda jsonb default '[]';
alter table public.events add column if not exists reminder_settings jsonb default '{"24h": true, "1h": true}';
alter table public.events add column if not exists meeting_platform text;
alter table public.events add column if not exists featured boolean default false;
alter table public.events add column if not exists archived boolean default false;
alter table public.events add column if not exists form_ids text[];
alter table public.events add column if not exists allow_registration_approval boolean default false;
alter table public.events add column if not exists notes text;

create index if not exists idx_events_event_type on public.events(event_type);
create index if not exists idx_events_created_by on public.events(created_by);
create index if not exists idx_events_featured on public.events(featured);
create index if not exists idx_events_archived on public.events(archived);
create index if not exists idx_events_program_id on public.events(program_id);

-- 2. ENHANCE event_attendees TABLE
alter table public.event_attendees add column if not exists waitlist_position integer;
alter table public.event_attendees add column if not exists waitlist_promoted_at timestamptz;
alter table public.event_attendees add column if not exists checked_in boolean default false;
alter table public.event_attendees add column if not exists checked_in_at timestamptz;
alter table public.event_attendees add column if not exists left_early boolean default false;
alter table public.event_attendees add column if not exists feedback_submitted boolean default false;
alter table public.event_attendees add column if not exists bookmarked boolean default false;

drop index if exists idx_attendees_event;
create index if not exists idx_attendees_event on public.event_attendees(event_id);
create index if not exists idx_attendees_user on public.event_attendees(user_id);
create index if not exists idx_attendees_waitlist on public.event_attendees(event_id, waitlist_position);

-- 3. EVENT SPEAKERS TABLE
create table if not exists public.event_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  title text,
  bio text,
  avatar_url text,
  linkedin_url text,
  company text,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_speakers_event on public.event_speakers(event_id);

-- 4. EVENT WAITLIST TABLE
create table if not exists public.event_waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  name text,
  email text,
  position integer not null,
  status text default 'waiting' check (status in ('waiting', 'promoted', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  promoted_at timestamptz,
  unique(event_id, user_id)
);

create index if not exists idx_event_waitlist_event on public.event_waitlist(event_id);
create index if not exists idx_event_waitlist_position on public.event_waitlist(event_id, position);

-- 5. EVENT ACTIVITY / TIMELINE TABLE
create table if not exists public.event_activity (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_event_activity_event on public.event_activity(event_id);
create index if not exists idx_event_activity_created on public.event_activity(created_at);

-- 6. EVENT COMMENTS / DISCUSSION TABLE
create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.event_comments(id) on delete cascade,
  content text not null,
  is_announcement boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_comments_event on public.event_comments(event_id);
create index if not exists idx_event_comments_parent on public.event_comments(parent_id);

-- 7. EVENT NOTIFICATIONS TRACKING
create table if not exists public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'new_event', 'registration_confirmed', 'registration_cancelled',
    'reminder_24h', 'reminder_1h', 'event_started',
    'event_cancelled', 'event_updated', 'waitlist_promoted',
    'attendance_recorded', 'feedback_request'
  )),
  sent_at timestamptz not null default now(),
  read boolean default false
);

create index if not exists idx_event_notifications_event on public.event_notifications(event_id);
create index if not exists idx_event_notifications_user on public.event_notifications(user_id);
create index if not exists idx_event_notifications_type on public.event_notifications(type);

-- 8. ENHANCE event_feedbacks TABLE
alter table public.event_feedbacks add column if not exists rating_breakdown jsonb;
alter table public.event_feedbacks add column if not exists would_recommend boolean;

-- 9. ENABLE REALTIME FOR ALL EVENT TABLES
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_attendees;
alter publication supabase_realtime add table public.event_waitlist;
alter publication supabase_realtime add table public.event_activity;
alter publication supabase_realtime add table public.event_comments;
alter publication supabase_realtime add table public.event_speakers;
alter publication supabase_realtime add table public.event_feedbacks;
alter publication supabase_realtime add table public.event_files;
alter publication supabase_realtime add table public.event_notifications;
alter publication supabase_realtime add table public.event_recordings;

-- 10. RLS POLICIES FOR NEW TABLES

-- Event speakers
alter table public.event_speakers enable row level security;
drop policy if exists "Anyone can read event speakers" on public.event_speakers;
create policy "Anyone can read event speakers"
  on public.event_speakers for select
  using (auth.role() = 'authenticated');
drop policy if exists "Event creators can manage speakers" on public.event_speakers;
create policy "Event creators can manage speakers"
  on public.event_speakers for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Event creators can update speakers" on public.event_speakers;
create policy "Event creators can update speakers"
  on public.event_speakers for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Event creators can delete speakers" on public.event_speakers;
create policy "Event creators can delete speakers"
  on public.event_speakers for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event waitlist
alter table public.event_waitlist enable row level security;
drop policy if exists "Users can read own waitlist" on public.event_waitlist;
create policy "Users can read own waitlist"
  on public.event_waitlist for select
  using (user_id = auth.uid());
drop policy if exists "Event creators can read waitlist" on public.event_waitlist;
create policy "Event creators can read waitlist"
  on public.event_waitlist for select
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Users can join waitlist" on public.event_waitlist;
create policy "Users can join waitlist"
  on public.event_waitlist for insert
  with check (user_id = auth.uid());
drop policy if exists "Users can cancel waitlist" on public.event_waitlist;
create policy "Users can cancel waitlist"
  on public.event_waitlist for update
  using (user_id = auth.uid());
drop policy if exists "Event creators can manage waitlist" on public.event_waitlist;
create policy "Event creators can manage waitlist"
  on public.event_waitlist for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));
drop policy if exists "Event creators can delete from waitlist" on public.event_waitlist;
create policy "Event creators can delete from waitlist"
  on public.event_waitlist for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event activity
alter table public.event_activity enable row level security;
drop policy if exists "Users can read event activity" on public.event_activity;
create policy "Users can read event activity"
  on public.event_activity for select
  using (auth.role() = 'authenticated');
drop policy if exists "Users can create event activity" on public.event_activity;
create policy "Users can create event activity"
  on public.event_activity for insert
  with check (auth.role() = 'authenticated');

-- Event comments
alter table public.event_comments enable row level security;
drop policy if exists "Users can read event comments" on public.event_comments;
create policy "Users can read event comments"
  on public.event_comments for select
  using (auth.role() = 'authenticated');
drop policy if exists "Users can create comments" on public.event_comments;
create policy "Users can create comments"
  on public.event_comments for insert
  with check (user_id = auth.uid());
drop policy if exists "Users can update own comments" on public.event_comments;
create policy "Users can update own comments"
  on public.event_comments for update
  using (user_id = auth.uid());
drop policy if exists "Users can delete own comments" on public.event_comments;
create policy "Users can delete own comments"
  on public.event_comments for delete
  using (user_id = auth.uid());

-- Event notifications
alter table public.event_notifications enable row level security;
drop policy if exists "Users can read own event notifications" on public.event_notifications;
create policy "Users can read own event notifications"
  on public.event_notifications for select
  using (user_id = auth.uid());
drop policy if exists "System can create event notifications" on public.event_notifications;
create policy "System can create event notifications"
  on public.event_notifications for insert
  with check (auth.role() = 'authenticated');
drop policy if exists "Users can update own event notifications" on public.event_notifications;
create policy "Users can update own event notifications"
  on public.event_notifications for update
  using (user_id = auth.uid());

-- 11. FIX EXISTING RLS FOR events TABLE - add DELETE policy
drop policy if exists "Mentors can delete own events" on public.events;
create policy "Mentors can delete own events"
  on public.events for delete
  using (created_by = auth.uid());

-- Add update for event_attendees - student can cancel own registration
drop policy if exists "Users can cancel own registration" on public.event_attendees;
create policy "Users can cancel own registration"
  on public.event_attendees for update
  using (user_id = auth.uid());

-- === End of 023_events_module14_complete.sql ===

-- Resource Management System - Complete Schema
-- Part of Module 13 implementation

-- ========================
-- 1. ENHANCE RESOURCES TABLE
-- ========================
alter table if exists public.resources
  add column if not exists description text,
  add column if not exists file_type text,
  add column if not exists file_size bigint default 0,
  add column if not exists file_path text,
  add column if not exists thumbnail_url text,
  add column if not exists duration text,
  add column if not exists status text default 'active' check (status in ('active', 'archived', 'draft')),
  add column if not exists visibility text default 'visible' check (visibility in ('visible', 'hidden')),
  add column if not exists featured boolean default false,
  add column if not exists is_archived boolean default false,
  add column if not exists version integer default 1,
  add column if not exists downloads_count integer default 0,
  add column if not exists views_count integer default 0,
  add column if not exists favorites_count integer default 0,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists external_url text,
  add column if not exists source_type text check (source_type in ('upload', 'link', 'youtube', 'github', 'googledrive', 'notion', 'figma', 'canva', 'website')),
  add column if not exists tags text[] default '{}',
  add column if not exists program_ids uuid[] default '{}',
  add column if not exists student_ids uuid[] default '{}';

-- Fix the url column to be nullable (for uploaded files without external URL)
alter table if exists public.resources
  alter column url drop not null;

-- ========================
-- 2. RESOURCE CATEGORIES
-- ========================
create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  color text default '#6366f1',
  parent_id uuid references public.resource_categories(id) on delete set null,
  sort_order integer default 0,
  is_archived boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================
-- 3. RESOURCE-TAGS MAPPING
-- ========================
create table if not exists public.resource_tags (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(resource_id, tag)
);

create index if not exists idx_resource_tags_resource on public.resource_tags(resource_id);
create index if not exists idx_resource_tags_tag on public.resource_tags(tag);

-- ========================
-- 4. RESOURCE ASSIGNMENTS (student / program)
-- ========================
create table if not exists public.resource_assignments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  constraint at_least_one_target check (student_id is not null or program_id is not null)
);

create index if not exists idx_resource_assignments_resource on public.resource_assignments(resource_id);
create index if not exists idx_resource_assignments_student on public.resource_assignments(student_id);
create index if not exists idx_resource_assignments_program on public.resource_assignments(program_id);

-- ========================
-- 5. RESOURCE VIEWS
-- ========================
create table if not exists public.resource_views (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create index if not exists idx_resource_views_resource on public.resource_views(resource_id);
create index if not exists idx_resource_views_user on public.resource_views(user_id);

-- ========================
-- 6. RESOURCE DOWNLOADS
-- ========================
create table if not exists public.resource_downloads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  downloaded_at timestamptz not null default now(),
  ip_address text
);

create index if not exists idx_resource_downloads_resource on public.resource_downloads(resource_id);
create index if not exists idx_resource_downloads_user on public.resource_downloads(user_id);

-- ========================
-- 7. RESOURCE FAVORITES / BOOKMARKS
-- ========================
create table if not exists public.resource_favorites (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bookmarked boolean default false,
  created_at timestamptz not null default now(),
  unique(resource_id, user_id)
);

create index if not exists idx_resource_favorites_resource on public.resource_favorites(resource_id);
create index if not exists idx_resource_favorites_user on public.resource_favorites(user_id);

-- ========================
-- 8. RESOURCE COMMENTS
-- ========================
create table if not exists public.resource_comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.resource_comments(id) on delete cascade,
  content text not null,
  mentions uuid[] default '{}',
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_resource_comments_resource on public.resource_comments(resource_id);

-- ========================
-- 9. RESOURCE VERSIONS
-- ========================
create table if not exists public.resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  version_number integer not null,
  title text,
  description text,
  file_path text,
  file_type text,
  file_size bigint default 0,
  external_url text,
  created_by uuid references public.profiles(id) on delete set null,
  change_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_resource_versions_resource on public.resource_versions(resource_id);

-- ========================
-- 10. RESOURCE ACTIVITY LOG
-- ========================
create table if not exists public.resource_activity (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'created', 'updated', 'deleted', 'restored', 'archived',
    'viewed', 'downloaded', 'favorited', 'unfavorited',
    'assigned', 'unassigned', 'commented', 'version_created',
    'featured', 'unfeatured', 'pinned', 'unpinned',
    'completed', 'shared', 'link_copied'
  )),
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_resource_activity_resource on public.resource_activity(resource_id);
create index if not exists idx_resource_activity_user on public.resource_activity(user_id);
create index if not exists idx_resource_activity_action on public.resource_activity(action);

-- ========================
-- 11. UPDATED RLS POLICIES
-- ========================

-- Resources: mentors can update
drop policy if exists "Mentors can update resources" on public.resources;
create policy "Mentors can update resources"
  on public.resources for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resources: mentors can delete (soft or hard)
drop policy if exists "Mentors can delete resources" on public.resources;
create policy "Mentors can delete resources"
  on public.resources for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource categories: authenticated read
drop policy if exists "Anyone can read resource categories" on public.resource_categories;
create policy "Anyone can read resource categories"
  on public.resource_categories for select
  using (auth.role() = 'authenticated');

-- Resource categories: mentors manage
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

-- Resource tags: authenticated read
drop policy if exists "Anyone can read resource tags" on public.resource_tags;
create policy "Anyone can read resource tags"
  on public.resource_tags for select
  using (auth.role() = 'authenticated');

-- Resource tags: mentors manage
drop policy if exists "Mentors manage resource tags" on public.resource_tags;
create policy "Mentors manage resource tags"
  on public.resource_tags for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource assignments: authenticated can read their own
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

-- Resource views: authenticated can insert (tracking)
drop policy if exists "Users can insert views" on public.resource_views;
create policy "Users can insert views"
  on public.resource_views for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can read views" on public.resource_views;
create policy "Users can read views"
  on public.resource_views for select
  using (auth.role() = 'authenticated');

-- Resource downloads: authenticated can insert
drop policy if exists "Users can insert downloads" on public.resource_downloads;
create policy "Users can insert downloads"
  on public.resource_downloads for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can read downloads" on public.resource_downloads;
create policy "Users can read downloads"
  on public.resource_downloads for select
  using (auth.role() = 'authenticated');

-- Resource favorites: users manage own
drop policy if exists "Users manage own favorites" on public.resource_favorites;
create policy "Users manage own favorites"
  on public.resource_favorites for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own favorites" on public.resource_favorites;
create policy "Users update own favorites"
  on public.resource_favorites for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own favorites" on public.resource_favorites;
create policy "Users delete own favorites"
  on public.resource_favorites for delete
  using (user_id = auth.uid());

drop policy if exists "Users read own favorites" on public.resource_favorites;
create policy "Users read own favorites"
  on public.resource_favorites for select
  using (auth.role() = 'authenticated');

-- Resource comments: authenticated read
drop policy if exists "Users read comments" on public.resource_comments;
create policy "Users read comments"
  on public.resource_comments for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users create comments" on public.resource_comments;
create policy "Users create comments"
  on public.resource_comments for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own comments" on public.resource_comments;
create policy "Users update own comments"
  on public.resource_comments for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own comments" on public.resource_comments;
create policy "Users delete own comments"
  on public.resource_comments for delete
  using (user_id = auth.uid());

-- Resource versions: authenticated read
drop policy if exists "Users read versions" on public.resource_versions;
create policy "Users read versions"
  on public.resource_versions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors create versions" on public.resource_versions;
create policy "Mentors create versions"
  on public.resource_versions for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource activity: authenticated read
drop policy if exists "Users read activity" on public.resource_activity;
create policy "Users read activity"
  on public.resource_activity for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users insert activity" on public.resource_activity;
create policy "Users insert activity"
  on public.resource_activity for insert
  with check (auth.role() = 'authenticated');

-- ========================
-- 12. TRIGGER: update updated_at
-- ========================
create or replace function public.update_resource_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_resource_timestamp on public.resources;
create trigger trigger_update_resource_timestamp
  before update on public.resources
  for each row
  execute function public.update_resource_timestamp();

-- ========================
-- 13. AUTO-CREATE ACTIVITY ON INSERT
-- ========================
create or replace function public.log_resource_activity()
returns trigger as $$
begin
  insert into public.resource_activity (resource_id, user_id, action, details)
  values (
    new.id,
    coalesce(new.created_by, auth.uid()),
    'created',
    jsonb_build_object('title', new.title)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_log_resource_activity on public.resources;
create trigger trigger_log_resource_activity
  after insert on public.resources
  for each row
  execute function public.log_resource_activity();

-- ========================
-- 14. INCREMENT DOWNLOADS COUNT
-- ========================
create or replace function public.increment_resource_downloads()
returns trigger as $$
begin
  update public.resources
  set downloads_count = downloads_count + 1
  where id = new.resource_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_increment_downloads on public.resource_downloads;
create trigger trigger_increment_downloads
  after insert on public.resource_downloads
  for each row
  execute function public.increment_resource_downloads();

-- ========================
-- 15. INCREMENT VIEWS COUNT
-- ========================
create or replace function public.increment_resource_views()
returns trigger as $$
begin
  update public.resources
  set views_count = views_count + 1
  where id = new.resource_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_increment_views on public.resource_views;
create trigger trigger_increment_views
  after insert on public.resource_views
  for each row
  execute function public.increment_resource_views();

-- ========================
-- 16. ADD RESOURCES TO REALTIME PUBLICATION
-- ========================
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.resource_categories;
alter publication supabase_realtime add table public.resource_tags;
alter publication supabase_realtime add table public.resource_assignments;
alter publication supabase_realtime add table public.resource_favorites;
alter publication supabase_realtime add table public.resource_comments;
alter publication supabase_realtime add table public.resource_activity;

-- ========================
-- 17. SEED DEFAULT CATEGORIES
-- ========================
insert into public.resource_categories (name, slug, description, icon, color, sort_order) values
  ('Interview Prep', 'interview-prep', 'Interview preparation materials and guides', 'Briefcase', '#ef4444', 1),
  ('Resume', 'resume', 'Resume templates and tips', 'FileText', '#f59e0b', 2),
  ('System Design', 'system-design', 'System design resources and case studies', 'Server', '#8b5cf6', 3),
  ('Career', 'career', 'Career development resources', 'TrendingUp', '#10b981', 4),
  ('Programming', 'programming', 'Programming tutorials and references', 'Code', '#3b82f6', 5),
  ('Frontend', 'frontend', 'Frontend development resources', 'Monitor', '#06b6d4', 6),
  ('Backend', 'backend', 'Backend development resources', 'Database', '#ec4899', 7),
  ('AI', 'ai', 'Artificial Intelligence resources', 'Brain', '#a855f7', 8),
  ('Machine Learning', 'machine-learning', 'Machine Learning resources', 'Cpu', '#f97316', 9),
  ('Assignments', 'assignments', 'Course assignments and projects', 'ClipboardList', '#14b8a6', 10),
  ('Projects', 'projects', 'Project templates and guides', 'FolderKanban', '#6366f1', 11),
  ('Templates', 'templates', 'Reusable templates', 'Layout', '#8b5cf6', 12),
  ('Guides', 'guides', 'Step-by-step guides', 'BookOpen', '#0ea5e9', 13),
  ('Reference', 'reference', 'Quick reference materials', 'Bookmark', '#84cc16', 14),
  ('Mock Interviews', 'mock-interviews', 'Mock interview practice', 'Mic', '#e11d48', 15),
  ('Soft Skills', 'soft-skills', 'Soft skills development', 'Heart', '#f43f5e', 16),
  ('Career Roadmap', 'career-roadmap', 'Career roadmap guides', 'Map', '#22c55e', 17),
  ('Certification', 'certification', 'Certification prep materials', 'Award', '#eab308', 18)
on conflict (name) do nothing;

-- Enable RLS on all new tables
alter table if exists public.resource_categories enable row level security;
alter table if exists public.resource_tags enable row level security;
alter table if exists public.resource_assignments enable row level security;
alter table if exists public.resource_views enable row level security;
alter table if exists public.resource_downloads enable row level security;
alter table if exists public.resource_favorites enable row level security;
alter table if exists public.resource_comments enable row level security;
alter table if exists public.resource_versions enable row level security;
alter table if exists public.resource_activity enable row level security;

-- Update storage bucket for mentor-resources to allow more file types
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json'
],
file_size_limit = 104857600
where id = 'mentor-resources';

-- === End of 023_resources_complete.sql ===

-- Reviews System - Comprehensive review lifecycle

-- Main reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  mentor_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'assigned' check (status in (
    'draft', 'assigned', 'pending', 'submitted', 'in_review', 'completed', 'archived'
  )),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  rating integer check (rating >= 1 and rating <= 5),
  feedback text,
  mentor_notes text,
  mentor_response text,
  student_response text,
  tags jsonb default '[]'::jsonb,
  estimated_review_time integer,
  completion_percentage integer default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
  last_edited_at timestamptz,
  last_edited_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  source_type text check (source_type in ('task', 'journal', 'form', 'program_review', 'manual')),
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Review history for timeline tracking
create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status text not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_student on public.reviews(student_id);
create index if not exists idx_reviews_mentor on public.reviews(mentor_id);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_reviews_priority on public.reviews(priority);
create index if not exists idx_reviews_due_date on public.reviews(due_date);
create index if not exists idx_reviews_created on public.reviews(created_at desc);
create index if not exists idx_reviews_program on public.reviews(program_id);
create index if not exists idx_review_history_review on public.review_history(review_id);
create index if not exists idx_reviews_source on public.reviews(source_type, source_id);

-- Enable realtime
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.review_history;

-- Add 'review' type to notifications check constraint
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in ('session', 'task', 'goal', 'system', 'journal', 'review', 'announcement'));

-- Add review types to timeline events
alter table public.student_timeline_events drop constraint if exists student_timeline_events_type_check;
alter table public.student_timeline_events add constraint student_timeline_events_type_check check (type in (
  'application_submitted', 'application_approved', 'program_assigned',
  'goal_created', 'goal_completed',
  'task_assigned', 'task_completed', 'task_reviewed',
  'form_submitted', 'session_completed',
  'file_shared', 'milestone_achieved', 'mentor_note',
  'review_assigned', 'review_submitted', 'review_completed',
  'review_returned', 'review_archived'
));

-- RLS policies
alter table public.reviews enable row level security;
alter table public.review_history enable row level security;

-- Reviews RLS
drop policy if exists "Students can read own reviews" on public.reviews;
create policy "Students can read own reviews"
  on public.reviews for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read assigned reviews" on public.reviews;
create policy "Mentors can read assigned reviews"
  on public.reviews for select
  using (mentor_id = auth.uid() or exists (
    select 1 from public.programs where programs.id = reviews.program_id and programs.mentor_id = auth.uid()
  ));

drop policy if exists "Students can create reviews" on public.reviews;
create policy "Students can create reviews"
  on public.reviews for insert
  with check (student_id = auth.uid());

drop policy if exists "Mentors can create reviews" on public.reviews;
create policy "Mentors can create reviews"
  on public.reviews for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

drop policy if exists "Students can update own reviews" on public.reviews;
create policy "Students can update own reviews"
  on public.reviews for update
  using (student_id = auth.uid());

drop policy if exists "Mentors can update assigned reviews" on public.reviews;
create policy "Mentors can update assigned reviews"
  on public.reviews for update
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can delete reviews" on public.reviews;
create policy "Mentors can delete reviews"
  on public.reviews for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Review history RLS
drop policy if exists "Participants can read review history" on public.review_history;
create policy "Participants can read review history"
  on public.review_history for select
  using (exists (
    select 1 from public.reviews
    where reviews.id = review_history.review_id
    and (reviews.student_id = auth.uid() or reviews.mentor_id = auth.uid())
  ));

drop policy if exists "Participants can create review history" on public.review_history;
create policy "Participants can create review history"
  on public.review_history for insert
  with check (exists (
    select 1 from public.reviews
    where reviews.id = review_id
    and (reviews.student_id = auth.uid() or reviews.mentor_id = auth.uid())
  ));

-- Function to auto-create review history on status change
create or replace function public.handle_review_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.review_history (review_id, actor_id, from_status, to_status)
  values (new.id, auth.uid(), old.status, new.status);
  return new;
end;
$$;

drop trigger if exists trg_review_status_change on public.reviews;
create trigger trg_review_status_change
  after update of status on public.reviews
  for each row
  when (old.status is distinct from new.status)
  execute function public.handle_review_status_change();

-- Function to auto-update updated_at
create or replace function public.handle_review_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_review_updated_at on public.reviews;
create trigger trg_review_updated_at
  before update on public.reviews
  for each row
  execute function public.handle_review_updated_at();

-- === End of 023_reviews_system.sql ===

-- Resource increment function (used by frontend)
create or replace function public.increment_resource_field(row_id uuid, field text, delta int)
returns void as $$
begin
  execute format(
    'update public.resources set %I = greatest(0, %I + $1) where id = $2',
    field, field
  ) using delta, row_id;
end;
$$ language plpgsql security definer;

-- === End of 024_resource_functions.sql ===

-- Reviews System Fixes
-- 1. Add missing indexes for performance
-- 2. Update notification RPC to support links
-- 3. Add trigger to update growth_score on review completion

create index if not exists idx_reviews_deleted_at on public.reviews(deleted_at);
create index if not exists idx_reviews_completed_at on public.reviews(completed_at);
create index if not exists idx_reviews_mentor_status on public.reviews(mentor_id, status) where deleted_at is null;
create index if not exists idx_reviews_student_status on public.reviews(student_id, status) where deleted_at is null;

-- Update notification RPC to accept link
create or replace function public.insert_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'system',
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, read, link)
  values (p_user_id, p_title, p_message, p_type, false, p_link);
end;
$$;

-- Function to update growth_score when a review is completed
create or replace function public.handle_review_growth_score()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set growth_score = coalesce(growth_score, 0) + 5,
      updated_at = now()
  where id = new.student_id;
  return new;
end;
$$;

drop trigger if exists trg_review_growth_score on public.reviews;
create trigger trg_review_growth_score
  after update of status on public.reviews
  for each row
  when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function public.handle_review_growth_score();

-- Ensure reviews tables are in realtime publication
alter publication supabase_realtime add table if not exists public.reviews;
alter publication supabase_realtime add table if not exists public.review_history;

-- === End of 025_reviews_fix.sql ===

-- Resource completions tracking (student marks resource as complete)
create table if not exists public.resource_completions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  completed_at timestamptz not null default now(),
  unique(resource_id, user_id)
);

create index if not exists idx_resource_completions_resource on public.resource_completions(resource_id);
create index if not exists idx_resource_completions_user on public.resource_completions(user_id);

-- Recently viewed tracking
create table if not exists public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete cascade not null,
  viewed_at timestamptz not null default now(),
  unique(user_id, resource_id)
);

create index if not exists idx_recently_viewed_user on public.recently_viewed(user_id);
create index if not exists idx_recently_viewed_resource on public.recently_viewed(resource_id);

-- RLS
alter table if exists public.resource_completions enable row level security;
alter table if exists public.recently_viewed enable row level security;

drop policy if exists "Users manage own completions" on public.resource_completions;
create policy "Users manage own completions"
  on public.resource_completions for insert
  with check (user_id = auth.uid());

create policy "Users read own completions"
  on public.resource_completions for select
  using (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'mentor'));

create policy "Users delete own completions"
  on public.resource_completions for delete
  using (user_id = auth.uid());

drop policy if exists "Users manage recently viewed" on public.recently_viewed;
create policy "Users manage recently viewed"
  on public.recently_viewed for insert
  with check (user_id = auth.uid());

create policy "Users read recently viewed"
  on public.recently_viewed for select
  using (user_id = auth.uid());

create policy "Users update recently viewed"
  on public.recently_viewed for update
  using (user_id = auth.uid());

-- Add to realtime
alter publication supabase_realtime add table public.resource_completions;
alter publication supabase_realtime add table public.recently_viewed;

-- Resource completion trigger (log activity)
create or replace function public.log_resource_completion()
returns trigger as $$
begin
  insert into public.resource_activity (resource_id, user_id, action, details)
  values (new.resource_id, new.user_id, 'completed', jsonb_build_object('completed_at', new.completed_at));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_log_resource_completion on public.resource_completions;
create trigger trigger_log_resource_completion
  after insert on public.resource_completions
  for each row
  execute function public.log_resource_completion();

-- Add completion tracking to resources table
alter table if exists public.resources
  add column if not exists completions_count integer default 0;

-- Increment completions count trigger
create or replace function public.increment_resource_completions()
returns trigger as $$
begin
  update public.resources
  set completions_count = completions_count + 1
  where id = new.resource_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_increment_completions on public.resource_completions;
create trigger trigger_increment_completions
  after insert on public.resource_completions
  for each row
  execute function public.increment_resource_completions();

-- Function to upsert recently_viewed
create or replace function public.upsert_recently_viewed(p_user_id uuid, p_resource_id uuid)
returns void as $$
begin
  insert into public.recently_viewed (user_id, resource_id, viewed_at)
  values (p_user_id, p_resource_id, now())
  on conflict (user_id, resource_id)
  do update set viewed_at = now();
end;
$$ language plpgsql security definer;

-- === End of 026_resource_completions.sql ===

-- Module 14 Fix: Complete Events & Workshop Management System fixes
-- Fixes RLS, realtime, indexes, event_type constraint, performance

-- 1. Add event_type check constraint to events table
alter table public.events drop constraint if exists events_event_type_check;
alter table public.events add constraint events_event_type_check
  check (event_type in (
    'Workshop', 'Webinar', 'Bootcamp', 'AMA Session', 'Group Mentoring',
    'Networking Event', 'Office Hours', 'Interview Session', 'Career Talk',
    'Alumni Talk', 'Live Coding', 'Mock Interview', 'Hackathon', 'Assessment',
    'Guest Lecture', 'Community Meetup'
  ));

-- 2. Add left_early to attendance_status check
alter table public.event_attendees drop constraint if exists event_attendees_attendance_status_check;
alter table public.event_attendees add constraint event_attendees_attendance_status_check
  check (attendance_status in ('none', 'attended', 'absent', 'left_early'));

-- 3. Add checked_in, waitlist_position, bookmarked columns if missing
alter table public.event_attendees add column if not exists waitlist_position integer;
alter table public.event_attendees add column if not exists checked_in boolean default false;
alter table public.event_attendees add column if not exists checked_in_at timestamptz;
alter table public.event_attendees add column if not exists left_early boolean default false;
alter table public.event_attendees add column if not exists feedback_submitted boolean default false;
alter table public.event_attendees add column if not exists bookmarked boolean default false;

-- 4. Ensure event_files type check includes all needed types
alter table public.event_files drop constraint if exists event_files_type_check;
alter table public.event_files add constraint event_files_type_check
  check (type in ('slides', 'pdf', 'assignment', 'recording', 'resource', 'video', 'template', 'github', 'figma', 'googledrive'));

-- 5. Add indexes for performance
create index if not exists idx_events_date_status on public.events(date, status);
create index if not exists idx_events_created_at on public.events(created_at desc);
create index if not exists idx_attendees_event_status on public.event_attendees(event_id, registration_status);
create index if not exists idx_attendees_user_reg on public.event_attendees(user_id, event_id);
create index if not exists idx_event_files_event on public.event_files(event_id);
create index if not exists idx_event_feedbacks_event on public.event_feedbacks(event_id);
create index if not exists idx_event_recordings_event on public.event_recordings(event_id);

-- 6. Ensure all event tables are in realtime publication
alter publication supabase_realtime add table if not exists public.events;
alter publication supabase_realtime add table if not exists public.event_attendees;
alter publication supabase_realtime add table if not exists public.event_waitlist;
alter publication supabase_realtime add table if not exists public.event_activity;
alter publication supabase_realtime add table if not exists public.event_comments;
alter publication supabase_realtime add table if not exists public.event_speakers;
alter publication supabase_realtime add table if not exists public.event_feedbacks;
alter publication supabase_realtime add table if not exists public.event_files;
alter publication supabase_realtime add table if not exists public.event_notifications;
alter publication supabase_realtime add table if not exists public.event_recordings;

-- 7. RLS: Ensure all policies exist

-- Events table RLS
drop policy if exists "Students can read published events" on public.events;
create policy "Students can read published events"
  on public.events for select
  using (visibility = 'public' or created_by = auth.uid() or
    exists (select 1 from public.event_attendees where event_id = events.id and user_id = auth.uid()));

drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

drop policy if exists "Mentors can update own events" on public.events;
create policy "Mentors can update own events"
  on public.events for update
  using (created_by = auth.uid());

drop policy if exists "Mentors can delete own events" on public.events;
create policy "Mentors can delete own events"
  on public.events for delete
  using (created_by = auth.uid());

-- Event attendees RLS
drop policy if exists "Authenticated users can read event attendees" on public.event_attendees;
create policy "Authenticated users can read event attendees"
  on public.event_attendees for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can register for events" on public.event_attendees;
create policy "Users can register for events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

drop policy if exists "Event creators can update attendees" on public.event_attendees;
create policy "Event creators can update attendees"
  on public.event_attendees for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Users can cancel own registration" on public.event_attendees;
create policy "Users can cancel own registration"
  on public.event_attendees for update
  using (user_id = auth.uid());

drop policy if exists "Users can delete own registration" on public.event_attendees;
create policy "Users can delete own registration"
  on public.event_attendees for delete
  using (user_id = auth.uid());

drop policy if exists "Event creators can delete attendees" on public.event_attendees;
create policy "Event creators can delete attendees"
  on public.event_attendees for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event speakers RLS
drop policy if exists "Anyone can read event speakers" on public.event_speakers;
create policy "Anyone can read event speakers"
  on public.event_speakers for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can manage speakers" on public.event_speakers;
create policy "Event creators can manage speakers"
  on public.event_speakers for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can update speakers" on public.event_speakers;
create policy "Event creators can update speakers"
  on public.event_speakers for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can delete speakers" on public.event_speakers;
create policy "Event creators can delete speakers"
  on public.event_speakers for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event waitlist RLS
drop policy if exists "Users can read own waitlist" on public.event_waitlist;
create policy "Users can read own waitlist"
  on public.event_waitlist for select
  using (user_id = auth.uid());

drop policy if exists "Event creators can read waitlist" on public.event_waitlist;
create policy "Event creators can read waitlist"
  on public.event_waitlist for select
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Users can join waitlist" on public.event_waitlist;
create policy "Users can join waitlist"
  on public.event_waitlist for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can cancel waitlist" on public.event_waitlist;
create policy "Users can cancel waitlist"
  on public.event_waitlist for update
  using (user_id = auth.uid());

drop policy if exists "Event creators can manage waitlist" on public.event_waitlist;
create policy "Event creators can manage waitlist"
  on public.event_waitlist for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can delete from waitlist" on public.event_waitlist;
create policy "Event creators can delete from waitlist"
  on public.event_waitlist for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event activity RLS
drop policy if exists "Users can read event activity" on public.event_activity;
create policy "Users can read event activity"
  on public.event_activity for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can create event activity" on public.event_activity;
create policy "Users can create event activity"
  on public.event_activity for insert
  with check (auth.role() = 'authenticated');

-- Event comments RLS
drop policy if exists "Users can read event comments" on public.event_comments;
create policy "Users can read event comments"
  on public.event_comments for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can create comments" on public.event_comments;
create policy "Users can create comments"
  on public.event_comments for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update own comments" on public.event_comments;
create policy "Users can update own comments"
  on public.event_comments for update
  using (user_id = auth.uid());

drop policy if exists "Users can delete own comments" on public.event_comments;
create policy "Users can delete own comments"
  on public.event_comments for delete
  using (user_id = auth.uid());

-- Event notifications RLS
drop policy if exists "Users can read own event notifications" on public.event_notifications;
create policy "Users can read own event notifications"
  on public.event_notifications for select
  using (user_id = auth.uid());

drop policy if exists "System can create event notifications" on public.event_notifications;
create policy "System can create event notifications"
  on public.event_notifications for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can update own event notifications" on public.event_notifications;
create policy "Users can update own event notifications"
  on public.event_notifications for update
  using (user_id = auth.uid());

-- Event files RLS
drop policy if exists "Authenticated users can read event files" on public.event_files;
create policy "Authenticated users can read event files"
  on public.event_files for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert files" on public.event_files;
create policy "Event creators can insert files"
  on public.event_files for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can update files" on public.event_files;
create policy "Event creators can update files"
  on public.event_files for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can delete files" on public.event_files;
create policy "Event creators can delete files"
  on public.event_files for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- Event feedbacks RLS
drop policy if exists "Authenticated users can read event feedbacks" on public.event_feedbacks;
create policy "Authenticated users can read event feedbacks"
  on public.event_feedbacks for select
  using (auth.role() = 'authenticated');

drop policy if exists "Attendees can submit feedback" on public.event_feedbacks;
create policy "Attendees can submit feedback"
  on public.event_feedbacks for insert
  with check (exists (select 1 from public.event_attendees where event_id = event_feedbacks.event_id and user_id = auth.uid()));

-- Event recordings RLS
drop policy if exists "Authenticated users can read event recordings" on public.event_recordings;
create policy "Authenticated users can read event recordings"
  on public.event_recordings for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert recordings" on public.event_recordings;
create policy "Event creators can insert recordings"
  on public.event_recordings for insert
  with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can update recordings" on public.event_recordings;
create policy "Event creators can update recordings"
  on public.event_recordings for update
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Event creators can delete recordings" on public.event_recordings;
create policy "Event creators can delete recordings"
  on public.event_recordings for delete
  using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

-- 8. Function to get upcoming events with attendee count (fix existing)
create or replace function public.get_upcoming_events()
returns table (
  id uuid,
  title text,
  date text,
  time text,
  event_type text,
  location text,
  capacity integer,
  attendee_count bigint,
  status text
)
language sql
security definer
stable
as $$
  select
    e.id,
    e.title,
    e.date,
    e.time,
    coalesce(e.event_type, e.category, 'Workshop'),
    e.location,
    e.capacity,
    (select count(*)::bigint from public.event_attendees ea where ea.event_id = e.id and ea.registration_status = 'confirmed'),
    e.status
  from public.events e
  where e.status in ('published', 'draft')
    and (e.date >= current_date or (e.date = current_date and e.time >= to_char(now(), 'HH24:MI')))
  order by e.date, e.time;
$$;

-- 9. Create event_summary view for dashboard analytics
create or replace view public.event_summary as
select
  e.id,
  e.title,
  e.date,
  e.time,
  coalesce(e.event_type, e.category, 'Workshop') as event_type,
  e.status,
  e.capacity,
  e.featured,
  e.created_by,
  e.created_at,
  e.program_id,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id) as total_registrations,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id and ea.registration_status = 'confirmed') as confirmed_registrations,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id and ea.attendance_status = 'attended') as attended_count,
  (select count(*)::int from public.event_attendees ea where ea.event_id = e.id and ea.attendance_status = 'absent') as absent_count,
  (select count(*)::int from public.event_waitlist ew where ew.event_id = e.id and ew.status = 'waiting') as waitlist_count,
  (select count(*)::int from public.event_feedbacks ef where ef.event_id = e.id) as feedback_count,
  coalesce((select avg(ef.rating)::numeric(3,2) from public.event_feedbacks ef where ef.event_id = e.id), 0) as avg_rating
from public.events e
where e.deleted_at is null;

-- 10. Enable RLS on views
alter view public.event_summary set (security_invoker = true);

-- === End of 027_events_module14_fix.sql ===

-- Gallery Module: production-ready gallery_items table + activity log + storage RLS fix

-- 1. Gallery items table
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Careers' check (category in ('Careers', 'Academic', 'Ceremonies', 'Virtual')),
  event_date text not null default '',
  location text not null default '',
  image_url text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  visibility text not null default 'published' check (visibility in ('published', 'draft', 'archived')),
  featured boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gallery_items_visibility on public.gallery_items(visibility);
create index if not exists idx_gallery_items_category on public.gallery_items(category);
create index if not exists idx_gallery_items_featured on public.gallery_items(featured);
create index if not exists idx_gallery_items_created_at on public.gallery_items(created_at desc);

-- 2. Gallery activity log
create table if not exists public.gallery_activity_log (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.gallery_items(id) on delete cascade,
  action text not null,
  user_id uuid references public.profiles(id) on delete set null,
  changes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_activity_log_gallery on public.gallery_activity_log(gallery_id);
create index if not exists idx_gallery_activity_log_created on public.gallery_activity_log(created_at desc);

-- 3. Auto-update updated_at
create or replace function public.update_gallery_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_gallery_items_updated_at on public.gallery_items;
create trigger trigger_gallery_items_updated_at
  before update on public.gallery_items
  for each row
  execute function public.update_gallery_items_updated_at();

-- 4. Increment view count
create or replace function public.increment_gallery_view_count(p_id uuid)
returns void as $$
begin
  update public.gallery_items
  set view_count = view_count + 1
  where id = p_id;
end;
$$ language plpgsql security definer;

-- 5. Activity log trigger
create or replace function public.log_gallery_activity()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (new.id, 'created', new.created_by, jsonb_build_object('title', new.title));
  elsif tg_op = 'UPDATE' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (new.id, 'updated', auth.uid(), jsonb_build_object('diff', case
      when old.title <> new.title then jsonb_build_object('title', jsonb_build_array(old.title, new.title))
      else '{}'::jsonb
    end));
  elsif tg_op = 'DELETE' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (old.id, 'deleted', auth.uid(), jsonb_build_object('title', old.title));
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_gallery_activity on public.gallery_items;
create trigger trigger_gallery_activity
  after insert or update or delete on public.gallery_items
  for each row
  execute function public.log_gallery_activity();

-- 6. RLS
alter table if exists public.gallery_items enable row level security;
alter table if exists public.gallery_activity_log enable row level security;

-- Public can read published items
drop policy if exists "Public read published gallery" on public.gallery_items;
create policy "Public read published gallery"
  on public.gallery_items for select
  using (visibility = 'published');

-- Authenticated users (mentors) can read all
drop policy if exists "Authenticated read all gallery" on public.gallery_items;
create policy "Authenticated read all gallery"
  on public.gallery_items for select
  to authenticated
  using (true);

-- Mentors can insert
drop policy if exists "Mentors insert gallery" on public.gallery_items;
create policy "Mentors insert gallery"
  on public.gallery_items for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Mentors can update
drop policy if exists "Mentors update gallery" on public.gallery_items;
create policy "Mentors update gallery"
  on public.gallery_items for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Mentors can delete
drop policy if exists "Mentors delete gallery" on public.gallery_items;
create policy "Mentors delete gallery"
  on public.gallery_items for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Activity log: mentors read all
drop policy if exists "Mentors read activity log" on public.gallery_activity_log;
create policy "Mentors read activity log"
  on public.gallery_activity_log for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 7. Add UPDATE RLS policy for gallery-images storage bucket (missing from 014_storage.sql)
drop policy if exists "gallery_mentor_update" on storage.objects;
create policy "gallery_mentor_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gallery-images' and exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 8. Add to realtime publication
alter publication supabase_realtime add table public.gallery_items;

-- === End of 028_gallery_module.sql ===

-- CRM enhancements for visitor_bookings
-- Adds: new columns, statuses, booking_notes, booking_timeline, realtime, trigger, RLS, stats function

-- 1. Add new CRM columns to visitor_bookings
alter table public.visitor_bookings add column if not exists company text;
alter table public.visitor_bookings add column if not exists student_professional text;
alter table public.visitor_bookings add column if not exists preferred_mentor text;
alter table public.visitor_bookings add column if not exists program_of_interest text;
alter table public.visitor_bookings add column if not exists meeting_type text;
alter table public.visitor_bookings add column if not exists timezone text;
alter table public.visitor_bookings add column if not exists message text;
alter table public.visitor_bookings add column if not exists source_page text;
alter table public.visitor_bookings add column if not exists assigned_mentor_id uuid references public.profiles(id);
alter table public.visitor_bookings add column if not exists assigned_mentor_name text;
alter table public.visitor_bookings add column if not exists internal_notes text;
alter table public.visitor_bookings add column if not exists priority text default 'medium' check (priority in ('low', 'medium', 'high'));
alter table public.visitor_bookings add column if not exists deleted_at timestamptz;

-- 2. Change status check constraint to 8 statuses, default 'new'
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'visitor_bookings_status_check' and conrelid = 'public.visitor_bookings'::regclass) then
    alter table public.visitor_bookings drop constraint visitor_bookings_status_check;
  end if;
end $$;

alter table public.visitor_bookings alter column status set default 'new';
alter table public.visitor_bookings add constraint visitor_bookings_status_check
  check (status in ('new', 'contacted', 'awaiting_confirmation', 'scheduled', 'completed', 'cancelled', 'rejected', 'no_response'));

-- 3. Create booking_notes table for internal mentor notes
create table if not exists public.booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.visitor_bookings(id) on delete cascade,
  mentor_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- 4. Create booking_timeline table for communication history
create table if not exists public.booking_timeline (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.visitor_bookings(id) on delete cascade,
  action text not null,
  description text,
  metadata jsonb default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_booking_timeline_booking_created on public.booking_timeline(booking_id, created_at);

-- 5. Add to realtime publication
alter publication supabase_realtime add table if not exists public.visitor_bookings;
alter publication supabase_realtime add table if not exists public.booking_notes;
alter publication supabase_realtime add table if not exists public.booking_timeline;

-- 6. Create updated_at trigger for visitor_bookings (uses handle_updated_at from 900_auth_triggers)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_visitor_bookings_updated_at') then
    create trigger set_visitor_bookings_updated_at before update on public.visitor_bookings for each row execute function public.handle_updated_at();
  end if;
end $$;

-- 7. RLS policies

-- Enable RLS on new tables
alter table public.booking_notes enable row level security;
alter table public.booking_timeline enable row level security;

-- Visitor bookings: anyone can insert, mentors can select/update
drop policy if exists "Anyone can insert visitor bookings" on public.visitor_bookings;
create policy "Anyone can insert visitor bookings"
  on public.visitor_bookings for insert
  with check (true);

drop policy if exists "Mentors can read visitor bookings" on public.visitor_bookings;
create policy "Mentors can read visitor bookings"
  on public.visitor_bookings for select
  using (public.is_mentor());

drop policy if exists "Mentors can update visitor bookings" on public.visitor_bookings;
create policy "Mentors can update visitor bookings"
  on public.visitor_bookings for update
  using (public.is_mentor());

-- Booking notes: mentors can insert/select/update/delete, visitors cannot access
drop policy if exists "Mentors can insert booking notes" on public.booking_notes;
create policy "Mentors can insert booking notes"
  on public.booking_notes for insert
  with check (public.is_mentor());

drop policy if exists "Mentors can read booking notes" on public.booking_notes;
create policy "Mentors can read booking notes"
  on public.booking_notes for select
  using (public.is_mentor());

drop policy if exists "Mentors can update booking notes" on public.booking_notes;
create policy "Mentors can update booking notes"
  on public.booking_notes for update
  using (public.is_mentor());

drop policy if exists "Mentors can delete booking notes" on public.booking_notes;
create policy "Mentors can delete booking notes"
  on public.booking_notes for delete
  using (public.is_mentor());

-- Booking timeline: mentors can insert/select
drop policy if exists "Mentors can insert booking timeline" on public.booking_timeline;
create policy "Mentors can insert booking timeline"
  on public.booking_timeline for insert
  with check (public.is_mentor());

drop policy if exists "Mentors can read booking timeline" on public.booking_timeline;
create policy "Mentors can read booking timeline"
  on public.booking_timeline for select
  using (public.is_mentor());

-- 8. Create get_booking_stats() function
create or replace function public.get_booking_stats()
returns table (
  new_count bigint,
  contacted_count bigint,
  awaiting_count bigint,
  scheduled_count bigint,
  completed_count bigint,
  cancelled_count bigint,
  rejected_count bigint,
  no_response_count bigint,
  conversion_rate numeric,
  total_bookings bigint,
  today_count bigint,
  this_week_count bigint,
  this_month_count bigint
)
language sql
stable
as $$
  select
    coalesce(count(*) filter (where status = 'new'), 0) as new_count,
    coalesce(count(*) filter (where status = 'contacted'), 0) as contacted_count,
    coalesce(count(*) filter (where status = 'awaiting_confirmation'), 0) as awaiting_count,
    coalesce(count(*) filter (where status = 'scheduled'), 0) as scheduled_count,
    coalesce(count(*) filter (where status = 'completed'), 0) as completed_count,
    coalesce(count(*) filter (where status = 'cancelled'), 0) as cancelled_count,
    coalesce(count(*) filter (where status = 'rejected'), 0) as rejected_count,
    coalesce(count(*) filter (where status = 'no_response'), 0) as no_response_count,
    case when count(*) > 0 then
      round(100.0 * count(*) filter (where status = 'completed') / nullif(count(*), 0), 1)
    else 0 end as conversion_rate,
    count(*) as total_bookings,
    coalesce(count(*) filter (where created_at >= current_date), 0) as today_count,
    coalesce(count(*) filter (where created_at >= date_trunc('week', current_date)), 0) as this_week_count,
    coalesce(count(*) filter (where created_at >= date_trunc('month', current_date)), 0) as this_month_count
  from public.visitor_bookings
  where deleted_at is null;
$$;

-- === End of 028_visitor_bookings_crm.sql ===

-- Module 19: Settings, Social Links, Website Settings

-- 1. Social Links table
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_links_platform on public.social_links(platform);
create index if not exists idx_social_links_created_by on public.social_links(created_by);

alter table if exists public.social_links enable row level security;

drop policy if exists "Public read social links" on public.social_links;
create policy "Public read social links"
  on public.social_links for select
  to public
  using (true);

drop policy if exists "Mentors manage social links" on public.social_links;
create policy "Mentors manage social links"
  on public.social_links for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 2. Website Settings table
create table if not exists public.website_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Mentorino',
  tagline text not null default 'Clarity in career, schooling, and life.',
  footer_text text not null default 'We build the trajectory you were meant to follow.',
  copyright text not null default '© 2026 MEntorino ALL RIGHTS RESERVED',
  contact_email text not null default '',
  contact_phone text not null default '',
  address text not null default '',
  logo_url text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.website_settings enable row level security;

drop policy if exists "Public read website settings" on public.website_settings;
create policy "Public read website settings"
  on public.website_settings for select
  to public
  using (true);

drop policy if exists "Mentors manage website settings" on public.website_settings;
create policy "Mentors manage website settings"
  on public.website_settings for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 3. Auto-update triggers
create or replace function public.update_social_links_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_social_links_updated_at on public.social_links;
create trigger trigger_social_links_updated_at
  before update on public.social_links
  for each row
  execute function public.update_social_links_updated_at();

create or replace function public.update_website_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_website_settings_updated_at on public.website_settings;
create trigger trigger_website_settings_updated_at
  before update on public.website_settings
  for each row
  execute function public.update_social_links_updated_at();

-- 4. Seed default website settings
insert into public.website_settings (site_name, tagline, footer_text, copyright)
values ('Mentorino', 'Clarity in career, schooling, and life.', 'We build the trajectory you were meant to follow.', '© 2026 MEntorino ALL RIGHTS RESERVED')
on conflict do nothing;

-- 5. Seed default social links
insert into public.social_links (platform, url, enabled, sort_order) values
  ('Instagram', '', true, 1),
  ('Twitter', '', true, 2),
  ('Linkedin', '', true, 3),
  ('Youtube', '', true, 4),
  ('Facebook', '', false, 5),
  ('TikTok', '', false, 6),
  ('GitHub', '', false, 7),
  ('Medium', '', false, 8),
  ('Website', '', false, 9),
  ('Behance', '', false, 10)
on conflict do nothing;

-- 6. Add to realtime publication
alter publication supabase_realtime add table public.social_links;
alter publication supabase_realtime add table public.website_settings;

-- 7. Increase profile-avatars bucket limit to 5MB to match client expectations
update storage.buckets
set file_size_limit = 5242880
where id = 'profile-avatars';

-- === End of 029_module19_complete.sql ===

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
drop policy if exists "Mentors can read all student profiles" on public.profiles;
create policy "Mentors can read all student profiles"
  on public.profiles for select
  using (public.is_mentor());

-- 9. RLS policy for mentors to update student profiles
drop policy if exists "Mentors can update all student profiles" on public.profiles;
create policy "Mentors can update all student profiles"
  on public.profiles for update
  using (public.is_mentor());

-- 10. Enable realtime for profiles table
alter publication supabase_realtime add table if not exists public.profiles;

-- === End of 030_crm_auto_create.sql ===

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

-- === End of 030_crm_module5_complete.sql ===

-- Messaging fixes: message-attachments bucket, missing columns, message status

-- Add missing columns to messages table for file support
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type text;

-- Add mentor_name to conversations for student-side display
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS mentor_name text;

-- Create message-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Message attachments: sender can write, participants can read
CREATE POLICY "msg_attach_sender_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "msg_attach_sender_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "msg_attach_sender_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "msg_attach_participant_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.file_url LIKE '%' || name || '%'
      AND cp.user_id = auth.uid()
    )
  );

-- Public website storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-website', 'public-website', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_website_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'public-website');
CREATE POLICY "public_website_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-website');

-- === End of 030_messaging_fixes.sql ===

-- ============================================================
-- FINAL FIX: Eliminate RLS recursion on profiles table
-- Problem:
--   is_mentor() read from public.profiles, which triggered the
--   "Mentors can read assigned students" policy, which called
--   is_mentor() again → infinite recursion detected by PG >= 14.
--
-- Previous fix (999_fix_rls_recursion_v2) used plpgsql + security
-- definer, but PG 15+ can still flag this as potential recursion.
--
-- This fix:
--   1. Rewrites is_mentor() to read from the JWT claims ONLY.
--      It never touches the profiles table.
--   2. Adds a trigger to sync profiles.role → auth.users metadata
--      on every insert/update so the JWT is always authoritative.
--   3. Syncs existing mentor roles in a one-shot DO block.
--   4. Rewrites the profiles SELECT policy to use a direct JWT
--      check, completely removing any profiles-table dependency.
-- ============================================================

-- ── 1. Sync trigger: profiles.role → auth.users.raw_user_meta_data ──
-- This ensures the JWT (which is signed from raw_user_meta_data) is
-- authoritative and always reflects the latest role from profiles.
create or replace function public.sync_profile_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'UPDATE' and new.role is not distinct from old.role then
    return new;
  end if;
  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_role_to_auth on public.profiles;
create trigger trg_sync_profile_role_to_auth
  after insert or update of role on public.profiles
  for each row
  execute function public.sync_profile_role_to_auth();

-- ── 2. One-shot sync for ALL existing profiles ──
do $$
declare
  rec record;
begin
  for rec in select id, role from public.profiles loop
    update auth.users
    set raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', rec.role)
    where id = rec.id
      and coalesce(raw_user_meta_data->>'role', '') <> rec.role;
  end loop;
end;
$$;

-- ── 3. Rewrite is_mentor() — reads JWT claims, NEVER queries profiles ──
drop function if exists public.is_mentor() cascade;

create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'mentor';
$$;

-- ── 4. Rewrite the profiles SELECT policy — NO is_mentor() call ──
--     Use a direct JWT claim check to avoid ANY profile-table query.
drop policy if exists "Mentors can read assigned students" on public.profiles;

create policy "Mentors can read assigned students"
  on public.profiles for select
  using (
    coalesce(
      nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
      nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
      ''
    ) = 'mentor'
  );

-- ── 5. Also fix the inline profiles queries in other policies ──
--     These don't cause recursion (different tables), but being
--     consistent avoids future issues. We replace the inline
--     `exists (select 1 from profiles where id = auth.uid() and role = 'mentor')`
--     patterns with public.is_mentor() which now uses JWT.

-- Bookings
drop policy if exists "Mentors can read all bookings" on public.bookings;
create policy "Mentors can read all bookings"
  on public.bookings for select
  using (public.is_mentor());

drop policy if exists "Mentors can update bookings" on public.bookings;
create policy "Mentors can update bookings"
  on public.bookings for update
  using (public.is_mentor());

-- Events
drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (public.is_mentor());

-- Applications
drop policy if exists "Mentors can read all applications" on public.applications;
create policy "Mentors can read all applications"
  on public.applications for select
  using (public.is_mentor());

drop policy if exists "Mentors can update applications" on public.applications;
create policy "Mentors can update applications"
  on public.applications for update
  using (public.is_mentor());

-- Resources
drop policy if exists "Mentors can manage resources" on public.resources;
create policy "Mentors can manage resources"
  on public.resources for insert
  with check (public.is_mentor());

-- Custom forms
drop policy if exists "Mentors can read custom forms" on public.custom_forms;
create policy "Mentors can read custom forms"
  on public.custom_forms for select
  using (public.is_mentor());

drop policy if exists "Mentors can create custom forms" on public.custom_forms;
create policy "Mentors can create custom forms"
  on public.custom_forms for insert
  with check (public.is_mentor());

-- Form templates
drop policy if exists "Mentors can read form templates" on public.form_templates;
create policy "Mentors can read form templates"
  on public.form_templates for select
  using (public.is_mentor());

drop policy if exists "Mentors can create form templates" on public.form_templates;
create policy "Mentors can create form templates"
  on public.form_templates for insert
  with check (public.is_mentor());

-- Products
drop policy if exists "Mentors can insert products" on public.products;
create policy "Mentors can insert products"
  on public.products for insert
  with check (public.is_mentor());

-- Announcements
drop policy if exists "Mentors can create announcements" on public.announcements;
create policy "Mentors can create announcements"
  on public.announcements for insert
  with check (public.is_mentor());

-- Student tags
drop policy if exists "Mentors can manage student tags" on public.student_tags;
create policy "Mentors can manage student tags"
  on public.student_tags for insert
  with check (public.is_mentor());

-- Student timeline events
drop policy if exists "Mentors can create timeline events" on public.student_timeline_events;
create policy "Mentors can create timeline events"
  on public.student_timeline_events for insert
  with check (public.is_mentor());

-- === End of 031_fix_is_mentor_jwt.sql ===

-- ============================================================
-- FIX: Admin policy on profiles causes infinite RLS recursion
--
-- Problem:
--   The "Admins full access to profiles" policy did:
--     exists (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   This queries profiles *inside* a profiles RLS policy,
--   which re-evaluates the policies and recurses forever.
--
--   PG >= 14 detects this and throws:
--     "infinite recursion detected in policy for relation 'profiles'"
--
-- Fix:
--   Rewrite ALL admin-policies to use JWT claims instead of
--   inline profiles queries.  This is consistent with the
--   is_mentor() JWT approach from migration 031.
-- ============================================================

-- ── 1. Ensure sync trigger from 031 exists (idempotent) ──
create or replace function public.sync_profile_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'UPDATE' and new.role is not distinct from old.role then
    return new;
  end if;
  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_role_to_auth on public.profiles;
create trigger trg_sync_profile_role_to_auth
  after insert or update of role on public.profiles
  for each row
  execute function public.sync_profile_role_to_auth();

-- ── 2. One-shot sync existing roles so JWT claims are accurate ──
do $$
declare
  rec record;
begin
  for rec in select id, role from public.profiles loop
    update auth.users
    set raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', rec.role)
    where id = rec.id
      and coalesce(raw_user_meta_data->>'role', '') <> rec.role;
  end loop;
end;
$$;

-- ── 3. JWT-based is_mentor() (replaces any leftover old version) ──
create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'mentor';
$$;

-- ── 4. JWT-based is_admin() helper ──
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
    ''
  ) = 'admin';
$$;

-- ── 5. Rewrite profiles SELECT policy to use JWT directly ──
drop policy if exists "Mentors can read assigned students" on public.profiles;

create policy "Mentors can read assigned students"
  on public.profiles for select
  using (
    coalesce(
      nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
      nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
      ''
    ) = 'mentor'
  );

-- ── 6. Fix the recursive admin policy on profiles ──
drop policy if exists "Admins full access to profiles" on public.profiles;

create policy "Admins full access to profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 7. Fix admin policies on OTHER tables too.
--      These don't cause recursion (different table), but
--      they are inconsistent and fragile. ──

-- Sessions
drop policy if exists "Admins full access to sessions" on public.sessions;
create policy "Admins full access to sessions"
  on public.sessions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Goals
drop policy if exists "Admins full access to goals" on public.goals;
create policy "Admins full access to goals"
  on public.goals for all
  using (public.is_admin())
  with check (public.is_admin());

-- Tasks
drop policy if exists "Admins full access to tasks" on public.tasks;
create policy "Admins full access to tasks"
  on public.tasks for all
  using (public.is_admin())
  with check (public.is_admin());

-- Applications
drop policy if exists "Admins full access to applications" on public.applications;
create policy "Admins full access to applications"
  on public.applications for all
  using (public.is_admin())
  with check (public.is_admin());

-- Programs
drop policy if exists "Admins full access to programs" on public.programs;
create policy "Admins full access to programs"
  on public.programs for all
  using (public.is_admin())
  with check (public.is_admin());

-- Events
drop policy if exists "Admins full access to events" on public.events;
create policy "Admins full access to events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- Notifications
drop policy if exists "Admins full access to notifications" on public.notifications;
create policy "Admins full access to notifications"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());

-- === End of 032_fix_admin_policy_recursion.sql ===

-- Sync columns that exist in TypeScript but are missing from DB

-- ── Events: add columns used by useEvents() ──
alter table if exists public.events add column if not exists event_type text;
alter table if exists public.events add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table if exists public.events add column if not exists meeting_platform text;
alter table if exists public.events add column if not exists allow_registration_approval boolean default false;
alter table if exists public.events add column if not exists notes text;

-- ── Bookings: add mentor_id column ──
alter table if exists public.bookings add column if not exists mentor_id uuid references public.profiles(id) on delete set null;

-- ── Also ensure bookings has updated_at ──
alter table if exists public.bookings add column if not exists updated_at timestamptz default now();

-- === End of 033_sync_missing_columns.sql ===

-- ============================================================
-- COMPREHENSIVE SCHEMA SYNCHRONISATION
-- Creates all missing tables and columns that the frontend
-- queries.  This is the "database side" of the schema fix.
-- ============================================================

-- ════════════════════════════════════════════════════════════
--  1.  RESOURCES — expand the bare-bones table
-- ════════════════════════════════════════════════════════════
alter table public.resources
  add column if not exists description     text,
  add column if not exists file_type       text,
  add column if not exists file_size       bigint default 0,
  add column if not exists file_path       text,
  add column if not exists thumbnail_url   text,
  add column if not exists duration        text,
  add column if not exists source_type     text,
  add column if not exists external_url    text,
  add column if not exists tags            jsonb default '[]'::jsonb,
  add column if not exists program_ids     jsonb default '[]'::jsonb,
  add column if not exists student_ids     jsonb default '[]'::jsonb,
  add column if not exists status          text default 'active',
  add column if not exists visibility      text default 'visible',
  add column if not exists featured        boolean default false,
  add column if not exists is_archived     boolean default false,
  add column if not exists version         integer default 1,
  add column if not exists views_count     integer default 0,
  add column if not exists downloads_count integer default 0,
  add column if not exists favorites_count integer default 0,
  add column if not exists completions_count integer default 0,
  add column if not exists updated_at      timestamptz default now();

-- ════════════════════════════════════════════════════════════
--  2.  Missing resource-* tables
-- ════════════════════════════════════════════════════════════

create table if not exists public.resource_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,
  description  text,
  icon         text,
  color        text default '#6366f1',
  parent_id    uuid references public.resource_categories(id) on delete set null,
  sort_order   integer default 0,
  is_archived  boolean default false,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists public.resource_favorites (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  bookmarked  boolean default true,
  created_at  timestamptz default now(),
  unique(resource_id, user_id)
);

create table if not exists public.resource_comments (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.resource_comments(id) on delete set null,
  content     text not null,
  edited_at   timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);

create table if not exists public.resource_versions (
  id             uuid primary key default gen_random_uuid(),
  resource_id    uuid not null references public.resources(id) on delete cascade,
  version_number integer not null default 1,
  file_path      text,
  file_type      text,
  file_size      bigint default 0,
  change_notes   text,
  created_at     timestamptz default now()
);

create table if not exists public.resource_activity (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  details     jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.resource_completions (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(resource_id, user_id)
);

create table if not exists public.resource_downloads (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists public.resource_assignments (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  program_id  uuid references public.programs(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now(),
  unique(resource_id, student_id)
);

create table if not exists public.recently_viewed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  viewed_at   timestamptz default now(),
  unique(user_id, resource_id)
);

-- ════════════════════════════════════════════════════════════
--  3.  REVIEWS system
-- ════════════════════════════════════════════════════════════

create table if not exists public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.profiles(id) on delete cascade,
  mentor_id             uuid not null references public.profiles(id) on delete cascade,
  program_id            uuid references public.programs(id) on delete set null,
  title                 text not null,
  description           text,
  status                text not null default 'assigned',
  priority              text default 'medium',
  due_date              timestamptz,
  rating                integer,
  feedback              text,
  mentor_notes          text,
  mentor_response       text,
  student_response      text,
  tags                  jsonb default '[]'::jsonb,
  estimated_review_time integer,
  completion_percentage integer default 0,
  last_edited_at        timestamptz,
  last_edited_by        uuid references public.profiles(id) on delete set null,
  completed_at          timestamptz,
  source_type           text,
  source_id             text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  deleted_at            timestamptz
);

create table if not exists public.review_history (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status   text not null,
  comment     text,
  created_at  timestamptz default now()
);

-- ════════════════════════════════════════════════════════════
--  4.  RLS for new tables — permissive for authenticated users
--      (same pattern used by the existing app code)
-- ════════════════════════════════════════════════════════════

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
    execute format('alter table public.%I enable row level security;', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'Authenticated full access') then
      execute format(
        'create policy "Authenticated full access" on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
        t
      );
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════
--  5.  Resource / reviews realtime (ignore if already added)
-- ════════════════════════════════════════════════════════════

do $$ declare
  tbls text[] := array[
    'resource_categories','resource_favorites','resource_comments',
    'resource_versions','resource_activity','resource_completions',
    'resource_downloads','resource_assignments','recently_viewed',
    'reviews','review_history'
  ];
  t text;
begin
  foreach t in array tbls loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;

-- === End of 034_complete_schema_sync.sql ===

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
  end if;
end $$;

-- Update updated_at on profile changes
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_profiles_updated_at') then
    create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_programs_updated_at') then
    create trigger set_programs_updated_at before update on public.programs for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_sessions_updated_at') then
    create trigger set_sessions_updated_at before update on public.sessions for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_goals_updated_at') then
    create trigger set_goals_updated_at before update on public.goals for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_tasks_updated_at') then
    create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_journals_updated_at') then
    create trigger set_journals_updated_at before update on public.journals for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_bookings_updated_at') then
    create trigger set_bookings_updated_at before update on public.bookings for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_conversations_updated_at') then
    create trigger set_conversations_updated_at before update on public.conversations for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_events_updated_at') then
    create trigger set_events_updated_at before update on public.events for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_applications_updated_at') then
    create trigger set_applications_updated_at before update on public.applications for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_mentor_settings_updated_at') then
    create trigger set_mentor_settings_updated_at before update on public.mentor_settings for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_dashboard_layouts_updated_at') then
    create trigger set_dashboard_layouts_updated_at before update on public.dashboard_layouts for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_form_templates_updated_at') then
    create trigger set_form_templates_updated_at before update on public.form_templates for each row execute function public.handle_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_mentor_availability_updated_at') then
    create trigger set_mentor_availability_updated_at before update on public.mentor_availability for each row execute function public.handle_updated_at();
  end if;
end $$;

-- === End of 900_auth_triggers.sql ===

-- Fix infinite RLS recursion on profiles table
-- The original is_mentor() helper (language sql) was inlined into the RLS policy,
-- so querying profiles inside a profiles policy caused infinite recursion.
-- Using plpgsql prevents inlining, and security definer bypasses RLS so we can
-- safely read profiles.role (the authoritative role source) instead of
-- auth.users.raw_user_meta_data (which is only set at signup and never synced).

create or replace function public.is_mentor()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'mentor'
  );
end;
$$;

-- === End of 999_fix_rls_recursion.sql ===

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

-- === End of 999_optimization.sql ===

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.sessions enable row level security;
alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.journals enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_files enable row level security;
alter table public.event_feedbacks enable row level security;
alter table public.event_recordings enable row level security;
alter table public.applications enable row level security;
alter table public.application_notes enable row level security;
alter table public.application_info_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.tags enable row level security;
alter table public.student_tags enable row level security;
alter table public.resources enable row level security;
alter table public.student_progress enable row level security;
alter table public.student_timeline_events enable row level security;
alter table public.mentor_settings enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.custom_forms enable row level security;
alter table public.form_templates enable row level security;
alter table public.form_submissions enable row level security;
alter table public.shared_files enable row level security;
alter table public.mentor_availability enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.announcements enable row level security;
alter table public.ai_chat_history enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;
alter table public.analytics_events enable row level security;

-- Helper: check if current user is mentor (avoids RLS recursion)
create or replace function public.is_mentor()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor');
$$;

-- ============================
-- PROFILES
-- ============================
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Mentors can read assigned students" on public.profiles;
create policy "Mentors can read assigned students"
  on public.profiles for select
  using (public.is_mentor());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Mentors can update students they mentor" on public.profiles;
create policy "Mentors can update students they mentor"
  on public.profiles for update
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = profiles.id and pr.mentor_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================
-- PROGRAMS
-- ============================
drop policy if exists "Anyone can read published programs" on public.programs;
create policy "Anyone can read published programs"
  on public.programs for select
  using (visibility = 'public' and status = 'published');

drop policy if exists "Mentors can read their own programs" on public.programs;
create policy "Mentors can read their own programs"
  on public.programs for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can insert programs" on public.programs;
create policy "Mentors can insert programs"
  on public.programs for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update their own programs" on public.programs;
create policy "Mentors can update their own programs"
  on public.programs for update
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can delete their own programs" on public.programs;
create policy "Mentors can delete their own programs"
  on public.programs for delete
  using (mentor_id = auth.uid());

-- ============================
-- PROGRAM ENROLLMENTS
-- ============================
drop policy if exists "Students can read own enrollments" on public.program_enrollments;
create policy "Students can read own enrollments"
  on public.program_enrollments for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read enrollments for their programs" on public.program_enrollments;
create policy "Mentors can read enrollments for their programs"
  on public.program_enrollments for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_enrollments.program_id and programs.mentor_id = auth.uid()
    )
  );

drop policy if exists "Students can enroll themselves" on public.program_enrollments;
create policy "Students can enroll themselves"
  on public.program_enrollments for insert
  with check (student_id = auth.uid());

drop policy if exists "Mentors can update enrollments" on public.program_enrollments;
create policy "Mentors can update enrollments"
  on public.program_enrollments for update
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_enrollments.program_id and programs.mentor_id = auth.uid()
    )
  );

-- ============================
-- SESSIONS
-- ============================
drop policy if exists "Participants can read sessions" on public.sessions;
create policy "Participants can read sessions"
  on public.sessions for select
  using (student_id = auth.uid() or mentor_id = auth.uid());

drop policy if exists "Mentors can insert sessions" on public.sessions;
create policy "Mentors can insert sessions"
  on public.sessions for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update sessions" on public.sessions;
create policy "Mentors can update sessions"
  on public.sessions for update
  using (mentor_id = auth.uid());

drop policy if exists "Students can update attendance" on public.sessions;
create policy "Students can update attendance"
  on public.sessions for update
  using (student_id = auth.uid());

-- ============================
-- GOALS
-- ============================
drop policy if exists "Students can read own goals" on public.goals;
create policy "Students can read own goals"
  on public.goals for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read students goals" on public.goals;
create policy "Mentors can read students goals"
  on public.goals for select
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = goals.student_id and pr.mentor_id = auth.uid()
    )
  );

drop policy if exists "Students can insert goals" on public.goals;
create policy "Students can insert goals"
  on public.goals for insert
  with check (student_id = auth.uid());

drop policy if exists "Students can update own goals" on public.goals;
create policy "Students can update own goals"
  on public.goals for update
  using (student_id = auth.uid());

drop policy if exists "Mentors can update students goals" on public.goals;
create policy "Mentors can update students goals"
  on public.goals for update
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = goals.student_id and pr.mentor_id = auth.uid()
    )
  );

-- ============================
-- GOAL MILESTONES
-- ============================
drop policy if exists "Goal milestones inherit goal policies" on public.goal_milestones;
create policy "Goal milestones inherit goal policies"
  on public.goal_milestones for select
  using (
    exists (select 1 from public.goals where goals.id = goal_milestones.goal_id)
  );

drop policy if exists "Students can manage own milestones" on public.goal_milestones;
create policy "Students can manage own milestones"
  on public.goal_milestones for insert
  with check (
    exists (select 1 from public.goals where goals.id = goal_id and goals.student_id = auth.uid())
  );

drop policy if exists "Mentors can manage milestones" on public.goal_milestones;
create policy "Mentors can manage milestones"
  on public.goal_milestones for insert
  with check (
    exists (
      select 1 from public.goals g
      join public.program_enrollments pe on g.student_id = pe.student_id
      join public.programs pr on pe.program_id = pr.id
      where g.id = goal_id and pr.mentor_id = auth.uid()
    )
  );

-- ============================
-- TASKS
-- ============================
drop policy if exists "Task participants can read" on public.tasks;
create policy "Task participants can read"
  on public.tasks for select
  using (student_id = auth.uid() or mentor_id = auth.uid());

drop policy if exists "Mentors can insert tasks" on public.tasks;
create policy "Mentors can insert tasks"
  on public.tasks for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update tasks" on public.tasks;
create policy "Mentors can update tasks"
  on public.tasks for update
  using (mentor_id = auth.uid());

drop policy if exists "Students can update task status" on public.tasks;
create policy "Students can update task status"
  on public.tasks for update
  using (student_id = auth.uid());

-- ============================
-- JOURNALS
-- ============================
drop policy if exists "Students can read own journals" on public.journals;
create policy "Students can read own journals"
  on public.journals for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read students journals" on public.journals;
create policy "Mentors can read students journals"
  on public.journals for select
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = journals.student_id and pr.mentor_id = auth.uid()
    )
  );

drop policy if exists "Students can insert journals" on public.journals;
create policy "Students can insert journals"
  on public.journals for insert
  with check (student_id = auth.uid());

drop policy if exists "Students can update own journals" on public.journals;
create policy "Students can update own journals"
  on public.journals for update
  using (student_id = auth.uid());

-- ============================
-- BOOKINGS
-- ============================
drop policy if exists "Users can read own bookings" on public.bookings;
create policy "Users can read own bookings"
  on public.bookings for select
  using (user_id = auth.uid());

drop policy if exists "Mentors can read all bookings" on public.bookings;
create policy "Mentors can read all bookings"
  on public.bookings for select
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'mentor')
  );

drop policy if exists "Users can insert own bookings" on public.bookings;
create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (user_id = auth.uid());

drop policy if exists "Mentors can update bookings" on public.bookings;
create policy "Mentors can update bookings"
  on public.bookings for update
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'mentor')
  );

-- ============================
-- MESSAGES & CONVERSATIONS
-- ============================
-- Conversations: SELECT
drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations"
  on public.conversations for select
  using (
    auth.uid() = mentor_id or auth.uid() = student_id or
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = conversations.id
    )
  );

-- Conversations: INSERT (mentors create conversations)
drop policy if exists "Mentors can create conversations" on public.conversations;
create policy "Mentors can create conversations"
  on public.conversations for insert
  with check (mentor_id = auth.uid());

-- Conversations: UPDATE (participants can update)
drop policy if exists "Participants can update conversations" on public.conversations;
create policy "Participants can update conversations"
  on public.conversations for update
  using (
    auth.uid() = mentor_id or auth.uid() = student_id or
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = conversations.id
    )
  );

-- Conversations: DELETE (mentors can delete own)
drop policy if exists "Mentors can delete conversations" on public.conversations;
create policy "Mentors can delete conversations"
  on public.conversations for delete
  using (mentor_id = auth.uid());

-- Conversation participants: SELECT
drop policy if exists "Users can read own participant records" on public.conversation_participants;
create policy "Users can read own participant records"
  on public.conversation_participants for select
  using (user_id = auth.uid());

-- Conversation participants: INSERT (mentors add participants to their conversations)
drop policy if exists "Mentors can add participants" on public.conversation_participants;
create policy "Mentors can add participants"
  on public.conversation_participants for insert
  with check (
    exists (
      select 1 from public.conversations
      where id = conversation_id and mentor_id = auth.uid()
    )
  );

-- Conversation participants: DELETE (mentors can remove participants)
drop policy if exists "Mentors can remove participants" on public.conversation_participants;
create policy "Mentors can remove participants"
  on public.conversation_participants for delete
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id and mentor_id = auth.uid()
    )
  );

-- Messages: INSERT
drop policy if exists "Participants can insert messages" on public.messages;
create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Messages: SELECT
drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Messages: UPDATE (own messages)
drop policy if exists "Users can update own messages" on public.messages;
create policy "Users can update own messages"
  on public.messages for update
  using (sender_id = auth.uid());

-- Messages: UPDATE (mark as read — any participant can update status)
drop policy if exists "Participants can update message status" on public.messages;
create policy "Participants can update message status"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- ============================
-- EVENTS
-- ============================
drop policy if exists "Anyone can read published events" on public.events;
create policy "Anyone can read published events"
  on public.events for select
  using (visibility = 'public');

drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can update own events" on public.events;
create policy "Mentors can update own events"
  on public.events for update
  using (created_by = auth.uid());

-- ============================
-- APPLICATIONS
-- ============================
drop policy if exists "Users can read own applications" on public.applications;
create policy "Users can read own applications"
  on public.applications for select
  using (user_id = auth.uid());

drop policy if exists "Mentors can read all applications" on public.applications;
create policy "Mentors can read all applications"
  on public.applications for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Anyone can submit application" on public.applications;
create policy "Anyone can submit application"
  on public.applications for insert
  with check (true);

drop policy if exists "Mentors can update applications" on public.applications;
create policy "Mentors can update applications"
  on public.applications for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- ============================
-- NOTIFICATIONS
-- ============================
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- ============================
-- SUPPLEMENTARY TABLES
-- ============================
-- Tags: anyone authenticated can read
drop policy if exists "Authenticated users can read tags" on public.tags;
create policy "Authenticated users can read tags"
  on public.tags for select
  using (auth.role() = 'authenticated');

-- Resources: anyone authenticated can read
drop policy if exists "Authenticated users can read resources" on public.resources;
create policy "Authenticated users can read resources"
  on public.resources for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors can manage resources" on public.resources;
create policy "Mentors can manage resources"
  on public.resources for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Mentor settings: own only
drop policy if exists "Mentors can read own settings" on public.mentor_settings;
create policy "Mentors can read own settings"
  on public.mentor_settings for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can manage own settings" on public.mentor_settings;
create policy "Mentors can manage own settings"
  on public.mentor_settings for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update own settings" on public.mentor_settings;
create policy "Mentors can update own settings"
  on public.mentor_settings for update
  using (mentor_id = auth.uid());

-- Dashboard layouts: own only
drop policy if exists "Users can read own layout" on public.dashboard_layouts;
create policy "Users can read own layout"
  on public.dashboard_layouts for select
  using (user_id = auth.uid());

drop policy if exists "Users can manage own layout" on public.dashboard_layouts;
create policy "Users can manage own layout"
  on public.dashboard_layouts for insert
  with check (user_id = auth.uid());

-- Custom forms: mentors and assigned users
drop policy if exists "Mentors can read custom forms" on public.custom_forms;
create policy "Mentors can read custom forms"
  on public.custom_forms for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can create custom forms" on public.custom_forms;
create policy "Mentors can create custom forms"
  on public.custom_forms for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Creators can update custom forms" on public.custom_forms;
create policy "Creators can update custom forms"
  on public.custom_forms for update
  using (created_by = auth.uid());

-- Form templates: mentors and creators
drop policy if exists "Mentors can read form templates" on public.form_templates;
create policy "Mentors can read form templates"
  on public.form_templates for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can create form templates" on public.form_templates;
create policy "Mentors can create form templates"
  on public.form_templates for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Creators can update form templates" on public.form_templates;
create policy "Creators can update form templates"
  on public.form_templates for update
  using (created_by = auth.uid());

-- Form submissions: own or mentor
drop policy if exists "Users can read own submissions" on public.form_submissions;
create policy "Users can read own submissions"
  on public.form_submissions for select
  using (user_id = auth.uid());

drop policy if exists "Users can submit forms" on public.form_submissions;
create policy "Users can submit forms"
  on public.form_submissions for insert
  with check (user_id = auth.uid());

-- Shared files: own or mentor of student
drop policy if exists "Users can read own files" on public.shared_files;
create policy "Users can read own files"
  on public.shared_files for select
  using (user_id = auth.uid());

-- Surveys
drop policy if exists "Authenticated users can read surveys" on public.surveys;
create policy "Authenticated users can read surveys"
  on public.surveys for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can submit survey responses" on public.survey_responses;
create policy "Users can submit survey responses"
  on public.survey_responses for insert
  with check (user_id = auth.uid());

-- Student progress: own or mentor
drop policy if exists "Students can read own progress" on public.student_progress;
create policy "Students can read own progress"
  on public.student_progress for select
  using (user_id = auth.uid());

drop policy if exists "Mentors can read students progress" on public.student_progress;
create policy "Mentors can read students progress"
  on public.student_progress for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = student_progress.program_id and programs.mentor_id = auth.uid()
    )
  );

-- AI chat history: own only
drop policy if exists "Users can read own AI chats" on public.ai_chat_history;
create policy "Users can read own AI chats"
  on public.ai_chat_history for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert own AI chats" on public.ai_chat_history;
create policy "Users can insert own AI chats"
  on public.ai_chat_history for insert
  with check (user_id = auth.uid());

-- Analytics: insert only (appending events)
drop policy if exists "Authenticated users can insert analytics" on public.analytics_events;
create policy "Authenticated users can insert analytics"
  on public.analytics_events for insert
  with check (auth.role() = 'authenticated');

-- ============================
-- EVENT CHILD TABLES
-- ============================
-- Event attendees
drop policy if exists "Authenticated users can read event attendees" on public.event_attendees;
create policy "Authenticated users can read event attendees"
  on public.event_attendees for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can register for events" on public.event_attendees;
create policy "Users can register for events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

drop policy if exists "Event creators can update attendees" on public.event_attendees;
create policy "Event creators can update attendees"
  on public.event_attendees for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can delete attendees" on public.event_attendees;
create policy "Event creators can delete attendees"
  on public.event_attendees for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- Event files
drop policy if exists "Authenticated users can read event files" on public.event_files;
create policy "Authenticated users can read event files"
  on public.event_files for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert files" on public.event_files;
create policy "Event creators can insert files"
  on public.event_files for insert
  with check (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can update files" on public.event_files;
create policy "Event creators can update files"
  on public.event_files for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can delete files" on public.event_files;
create policy "Event creators can delete files"
  on public.event_files for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- Event feedbacks
drop policy if exists "Authenticated users can read event feedbacks" on public.event_feedbacks;
create policy "Authenticated users can read event feedbacks"
  on public.event_feedbacks for select
  using (auth.role() = 'authenticated');

drop policy if exists "Attendees can submit feedback" on public.event_feedbacks;
create policy "Attendees can submit feedback"
  on public.event_feedbacks for insert
  with check (
    exists (select 1 from public.event_attendees where event_id = event_feedbacks.event_id and user_id = auth.uid())
  );

-- Event recordings
drop policy if exists "Authenticated users can read event recordings" on public.event_recordings;
create policy "Authenticated users can read event recordings"
  on public.event_recordings for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert recordings" on public.event_recordings;
create policy "Event creators can insert recordings"
  on public.event_recordings for insert
  with check (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can update recordings" on public.event_recordings;
create policy "Event creators can update recordings"
  on public.event_recordings for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can delete recordings" on public.event_recordings;
create policy "Event creators can delete recordings"
  on public.event_recordings for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- ============================
-- APPLICATION NOTES
-- ============================
drop policy if exists "Users can read own application notes" on public.application_notes;
create policy "Users can read own application notes"
  on public.application_notes for select
  using (author_id = auth.uid());

drop policy if exists "Users can create application notes" on public.application_notes;
create policy "Users can create application notes"
  on public.application_notes for insert
  with check (author_id = auth.uid());

drop policy if exists "Users can update own application notes" on public.application_notes;
create policy "Users can update own application notes"
  on public.application_notes for update
  using (author_id = auth.uid());

-- ============================
-- PRODUCTS (STORE)
-- ============================
drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
  on public.products for select
  using (true);

drop policy if exists "Mentors can insert products" on public.products;
create policy "Mentors can insert products"
  on public.products for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- ============================
-- TRANSACTIONS
-- ============================
drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions for select
  using (user_id = auth.uid());

drop policy if exists "Users can create transactions" on public.transactions;
create policy "Users can create transactions"
  on public.transactions for insert
  with check (user_id = auth.uid());

-- ============================
-- ANNOUNCEMENTS
-- ============================
drop policy if exists "Authenticated users can read announcements" on public.announcements;
create policy "Authenticated users can read announcements"
  on public.announcements for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors can create announcements" on public.announcements;
create policy "Mentors can create announcements"
  on public.announcements for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- ============================
-- MENTOR AVAILABILITY
-- ============================
drop policy if exists "Mentors can read own availability" on public.mentor_availability;
create policy "Mentors can read own availability"
  on public.mentor_availability for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can manage own availability" on public.mentor_availability;
create policy "Mentors can manage own availability"
  on public.mentor_availability for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update own availability" on public.mentor_availability;
create policy "Mentors can update own availability"
  on public.mentor_availability for update
  using (mentor_id = auth.uid());

-- ============================
-- STUDENT TAGS
-- ============================
drop policy if exists "Authenticated users can read student tags" on public.student_tags;
create policy "Authenticated users can read student tags"
  on public.student_tags for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors can manage student tags" on public.student_tags;
create policy "Mentors can manage student tags"
  on public.student_tags for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- ============================
-- STUDENT TIMELINE EVENTS
-- ============================
drop policy if exists "Students can read own timeline" on public.student_timeline_events;
create policy "Students can read own timeline"
  on public.student_timeline_events for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can create timeline events" on public.student_timeline_events;
create policy "Mentors can create timeline events"
  on public.student_timeline_events for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );


-- === End of 999_rls.sql ===

