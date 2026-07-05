import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompression';

type BucketName = 'profile-avatars' | 'student-documents' | 'mentor-resources' | 'gallery-images' | 'message-attachments';

class StorageService {
  private getPath(bucket: BucketName, userId: string, fileName: string): string {
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${userId}/${timestamp}_${safeName}`;
  }

  async upload(bucket: BucketName, userId: string, file: File): Promise<string> {
    const compressed = await compressImage(file);
    const path = this.getPath(bucket, userId, compressed.name);
    const { data, error } = await supabase.storage.from(bucket).upload(path, compressed, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    return path;
  }

  async getPublicUrl(bucket: BucketName, path: string): Promise<string> {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  async getPublicUrlFromPath(bucket: BucketName, path: string, expiresIn = 3600): Promise<string> {
    return this.getSignedUrl(bucket, path, expiresIn);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const compressed = await compressImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
      maxSizeBytes: 1 * 1024 * 1024,
    });
    return this.upload('profile-avatars', userId, compressed);
  }

  async uploadStudentDocument(userId: string, file: File): Promise<string> {
    return this.upload('student-documents', userId, file);
  }

  async uploadMentorResource(userId: string, file: File): Promise<string> {
    return this.upload('mentor-resources', userId, file);
  }

  async uploadGalleryImage(userId: string, file: File): Promise<string> {
    const compressed = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      maxSizeBytes: 3 * 1024 * 1024,
    });
    return this.upload('gallery-images', userId, compressed);
  }

  async uploadMessageAttachment(userId: string, file: File): Promise<string> {
    return this.upload('message-attachments', userId, file);
  }

  async delete(bucket: BucketName, url: string): Promise<void> {
    const path = url.split('/').slice(-2).join('/');
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }

  async getSignedUrl(bucket: BucketName, path: string, expiresIn = 60): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  async listFiles(bucket: BucketName, userId: string): Promise<{ name: string; url: string }[]> {
    const { data, error } = await supabase.storage.from(bucket).list(userId);
    if (error) throw error;
    const files = data || [];
    return Promise.all(files.map(async f => ({
      name: f.name,
      url: await this.getSignedUrl(bucket, `${userId}/${f.name}`, 3600),
    })));
  }
}

export const storageService = new StorageService();
