import { supabase } from '../lib/supabase';
import { ResourceLink, ServiceResponse } from '../types';

export const resourceService = {
  async fetchAll(lessonId?: string): Promise<ServiceResponse<ResourceLink[]>> {
    let query = supabase.from('resources').select('*').order('is_pinned', { ascending: false });
    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  },

  async insert(resource: Omit<ResourceLink, 'id' | 'is_pinned'>): Promise<ServiceResponse<ResourceLink>> {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: resource.title,
        url: resource.url,
        category: resource.category,
        is_pinned: false,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ResourceLink, error: null };
  },

  async getUploadUrl(fileName: string, bucket: string): Promise<ServiceResponse<{ signedUrl: string }>> {
    return { data: null, error: 'Upload not available in frontend-only mode' };
  },

  async getDownloadUrl(path: string, bucket: string): Promise<ServiceResponse<{ signedUrl: string }>> {
    return { data: null, error: 'Download not available in frontend-only mode' };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) return { data: undefined, error: error.message };
    return { data: undefined, error: null };
  },
};