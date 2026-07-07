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
DROP POLICY IF EXISTS "msg_attach_sender_write" ON storage.objects;
CREATE POLICY "msg_attach_sender_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "msg_attach_sender_update" ON storage.objects;
CREATE POLICY "msg_attach_sender_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "msg_attach_sender_delete" ON storage.objects;
CREATE POLICY "msg_attach_sender_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "msg_attach_participant_read" ON storage.objects;
CREATE POLICY "msg_attach_participant_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.file_url = ('message-attachments/' || name)
      AND cp.user_id = auth.uid()
    )
  );

-- Public website storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-website', 'public-website', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_website_read" ON storage.objects;
CREATE POLICY "public_website_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'public-website');
DROP POLICY IF EXISTS "public_website_write" ON storage.objects;
CREATE POLICY "public_website_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-website'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
  );
