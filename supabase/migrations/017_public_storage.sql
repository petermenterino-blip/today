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

CREATE POLICY "docs_auth_read_applications" 
  ON storage.objects 
  FOR SELECT 
  TO authenticated 
  USING (
    bucket_id = 'student-documents' 
    AND (storage.foldername(name))[1] = 'applications'
  );
