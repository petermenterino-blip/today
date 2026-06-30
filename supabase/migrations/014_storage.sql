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
