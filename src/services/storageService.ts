import { supabase } from '../lib/supabase';

type BucketName = 'profile-avatars' | 'student-documents' | 'mentor-resources' | 'gallery-images' | 'message-attachments';

class StorageService {
  private getPath(bucket: BucketName, userId: string, fileName: string): string {
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${userId}/${timestamp}_${safeName}`;
  }

  async upload(bucket: BucketName, userId: string, file: File): Promise<string> {
    const path = this.getPath(bucket, userId, file.name);
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    return path;
  }

  getPublicUrl(bucket: BucketName, path: string): { data: { publicUrl: string } } {
    return supabase.storage.from(bucket).getPublicUrl(path);
  }

  async getPublicUrlFromPath(bucket: BucketName, path: string): Promise<string> {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    return this.upload('profile-avatars', userId, file);
  }

  async uploadStudentDocument(userId: string, file: File): Promise<string> {
    return this.upload('student-documents', userId, file);
  }

  async uploadMentorResource(userId: string, file: File): Promise<string> {
    return this.upload('mentor-resources', userId, file);
  }

  async uploadGalleryImage(userId: string, file: File): Promise<string> {
    return this.upload('gallery-images', userId, file);
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
    return (data || []).map(f => ({
      name: f.name,
      url: `${supabase.storage.from(bucket).getPublicUrl(`${userId}/${f.name}`).data.publicUrl}`,
    }));
  }
}

export const storageService = new StorageService();
