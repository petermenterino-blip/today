-- Storage Buckets Configuration (v1.0 Stable)
-- Generated from migration files

-- ====================================
-- BUCKETS
-- ====================================

-- profile-avatars (Public, 5MB, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- student-documents (Private, 10MB, documents + images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('student-documents', 'student-documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- mentor-resources (Private, 100MB, all types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('mentor-resources', 'mentor-resources', false, 104857600, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','application/x-zip-compressed','image/png','image/jpeg','image/jpg','image/webp','image/gif','image/svg+xml','video/mp4','video/webm','video/quicktime','audio/mpeg','audio/wav','audio/ogg','audio/mp4','text/plain','text/markdown','text/csv','application/json'])
ON CONFLICT (id) DO NOTHING;

-- gallery-images (Public, 5MB, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-images', 'gallery-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- message-attachments (Private, 25MB, all media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('message-attachments', 'message-attachments', false, 26214400, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','image/png','image/jpeg','image/gif','image/webp','application/zip','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm','audio/mp4','video/mp4','video/webm','video/ogg'])
ON CONFLICT (id) DO NOTHING;

-- shared_files (Private, 50MB)
-- Created in 020_module6_complete.sql

-- public-website (Public, 10MB, images + pdf)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-website', 'public-website', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- POLICIES
-- ====================================

-- profile-avatars policies
CREATE POLICY 'avatars_public_read' ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-avatars');
CREATE POLICY 'avatars_owner_write' ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'avatars_owner_update' ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'avatars_owner_delete' ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- student-documents policies
CREATE POLICY 'docs_student_write' ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'docs_student_read_own' ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'docs_mentor_read_assigned' ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor') AND EXISTS (SELECT 1 FROM public.program_enrollments pe JOIN public.programs pr ON pe.program_id = pr.id WHERE pr.mentor_id = auth.uid() AND pe.student_id::text = (storage.foldername(name))[1]));
CREATE POLICY 'docs_owner_delete' ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'docs_anon_upload_applications' ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = 'applications');
CREATE POLICY 'docs_anon_read_applications' ON storage.objects FOR SELECT TO public USING (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = 'applications');

-- mentor-resources policies
CREATE POLICY 'resources_mentor_write' ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mentor-resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY 'resources_mentor_update' ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'mentor-resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY 'resources_mentor_delete' ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mentor-resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY 'resources_auth_read' ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'mentor-resources');

-- gallery-images policies
CREATE POLICY 'gallery_public_read' ON storage.objects FOR SELECT TO public USING (bucket_id = 'gallery-images');
CREATE POLICY 'gallery_mentor_write' ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY 'gallery_mentor_delete' ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor'));

-- message-attachments policies
CREATE POLICY 'msg_attach_sender_write' ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'msg_attach_sender_update' ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'msg_attach_sender_delete' ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY 'msg_attach_participant_read' ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'message-attachments' AND EXISTS (SELECT 1 FROM public.messages m JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id WHERE m.file_url LIKE '%' || name || '%' AND cp.user_id = auth.uid()));

-- public-website policies
CREATE POLICY 'public_website_read' ON storage.objects FOR SELECT TO public USING (bucket_id = 'public-website');
CREATE POLICY 'public_website_write' ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-website');

-- shared_files policies (from 020_module6_complete.sql)
-- (add shared_files policies here if separate)
