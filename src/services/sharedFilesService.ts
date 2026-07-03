import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';
import { timelineService } from './timelineService';

export interface SharedFileRecord {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: string;
  category?: string;
  shared_at: string;
  storage_path: string;
  size: number;
}

function fromDb(row: any): SharedFileRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    url: row.url,
    type: row.type || 'Other',
    category: row.category || '',
    shared_at: row.shared_at,
    storage_path: row.storage_path || '',
    size: row.size || 0,
  };
}

function toDb(data: Partial<SharedFileRecord>): Record<string, any> {
  const db: Record<string, any> = {};
  if (data.user_id !== undefined) db.user_id = data.user_id;
  if (data.name !== undefined) db.name = data.name;
  if (data.url !== undefined) db.url = data.url;
  if (data.type !== undefined) db.type = data.type;
  if (data.category !== undefined) db.category = data.category;
  if (data.storage_path !== undefined) db.storage_path = data.storage_path;
  if (data.size !== undefined) db.size = data.size;
  return db;
}

const ALLOWED_TYPES = [
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
  'text/plain',
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function getFileType(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPTX';
  if (mimeType.includes('image')) return 'IMAGE';
  if (mimeType.includes('zip')) return 'ZIP';
  return 'Other';
}

const STORAGE_BUCKET = 'shared_files';

export const sharedFilesService = {
  async ensureBucket(): Promise<void> {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.id === STORAGE_BUCKET)) {
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
    }
  },

  async upload(
    userId: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<SharedFileRecord | null> {
    if (!ALLOWED_TYPES.includes(file.type) && file.type) {
      throw new Error(`File type ${file.type} is not supported. Allowed: PDF, DOCX, PPTX, PNG, JPG, ZIP`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`File size exceeds the ${MAX_SIZE / 1024 / 1024}MB limit`);
    }

    await this.ensureBucket();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (!urlData) throw new Error('Failed to generate signed URL');

    const fileType = getFileType(file.type);

    const result = await safeMutate(
      'sharedFilesService.create',
      () => supabase
        .from('shared_files')
        .insert({
          user_id: userId,
          name: file.name,
          url: urlData.signedUrl,
          type: fileType,
          storage_path: storagePath,
          size: file.size,
        })
        .select()
        .single(),
    );

    if (result.error || !result.data) throw new Error('Failed to save file record');
    
    timelineService.autoLogFileShared(userId, file.name).catch(() => {});
    
    return fromDb(result.data);
  },

  async getByUserId(userId: string): Promise<SharedFileRecord[]> {
    const result = await safeQuery(
      'sharedFilesService.getByUserId',
      () => supabase
        .from('shared_files')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('shared_at', { ascending: false }),
      [],
    );
    if (result.error) console.warn('sharedFilesService.getByUserId:', interpretError(result.error));
    return (result.data || []).map(fromDb);
  },

  async getAll(): Promise<SharedFileRecord[]> {
    const result = await safeQuery(
      'sharedFilesService.getAll',
      () => supabase
        .from('shared_files')
        .select('*')
        .is('deleted_at', null)
        .order('shared_at', { ascending: false }),
      [],
    );
    if (result.error) console.warn('sharedFilesService.getAll:', interpretError(result.error));
    return (result.data || []).map(fromDb);
  },

  async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);
    if (error || !data) throw error || new Error('Failed to generate signed URL');
    return data.signedUrl;
  },

  async rename(id: string, newName: string): Promise<boolean> {
    if (!newName.trim()) throw new Error('Name cannot be empty');
    const result = await safeMutate(
      'sharedFilesService.rename',
      () => supabase
        .from('shared_files')
        .update({ name: newName.trim() })
        .eq('id', id),
    );
    return !result.error;
  },

  async delete(id: string, storagePath: string): Promise<boolean> {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    const result = await safeMutate(
      'sharedFilesService.delete',
      () => supabase
        .from('shared_files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id),
    );
    return !result.error;
  },

  async replace(id: string, storagePath: string, file: File): Promise<SharedFileRecord | null> {
    if (!ALLOWED_TYPES.includes(file.type) && file.type) {
      throw new Error(`File type ${file.type} is not supported.`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`File size exceeds the ${MAX_SIZE / 1024 / 1024}MB limit`);
    }

    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    const fileType = getFileType(file.type);

    const result = await safeMutate(
      'sharedFilesService.replace',
      () => supabase
        .from('shared_files')
        .update({
          name: file.name,
          type: fileType,
          size: file.size,
          url: urlData?.signedUrl || '',
        })
        .eq('id', id)
        .select()
        .single(),
    );
    if (result.error || !result.data) return null;
    return fromDb(result.data);
  },

  async getDownloadUrl(storagePath: string, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    if (error || !data) throw error || new Error('Failed to generate download URL');
    return data.signedUrl;
  },
};
