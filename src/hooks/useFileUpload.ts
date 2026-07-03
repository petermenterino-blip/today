import { useState, useCallback } from 'react';
import { storageService } from '../services/storageService';

type BucketName = 'profile-avatars' | 'student-documents' | 'mentor-resources' | 'gallery-images' | 'message-attachments';

export const useFileUpload = (bucket: BucketName) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (userId: string, file: File): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    try {
      const url = await storageService.upload(bucket, userId, file);
      setProgress(100);
      return url;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }, [bucket]);

  const uploadMultiple = useCallback(async (userId: string, files: File[]): Promise<(string | null)[]> => {
    setUploading(true);
    const results = await Promise.allSettled(files.map(f => storageService.upload(bucket, userId, f)));
    setUploading(false);
    return results.map(r => r.status === 'fulfilled' ? r.value : null);
  }, [bucket]);

  return { upload, uploadMultiple, uploading, progress };
};
