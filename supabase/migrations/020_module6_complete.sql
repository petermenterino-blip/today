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
