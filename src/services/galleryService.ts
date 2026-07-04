import { supabase } from '../lib/supabase';
import { GalleryItem, GalleryCategory, GalleryVisibility } from '../interfaces/gallery.interface';
import { storageService } from './storageService';

function fromDb(row: any): GalleryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category,
    event_date: row.event_date || '',
    location: row.location || '',
    image_url: row.image_url || '',
    created_by: row.created_by,
    visibility: row.visibility || 'published',
    featured: row.featured || false,
    view_count: row.view_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    creator_name: row.profiles?.name,
    creator_avatar: row.profiles?.avatar_url,
  };
}

export const galleryService = {
  async fetchAll(options?: {
    visibility?: GalleryVisibility;
    category?: GalleryCategory | 'All';
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: GalleryItem[]; error: string | null }> {
    let query = supabase
      .from('gallery_items')
      .select('*, profiles!gallery_items_created_by_fkey(name, avatar_url)')
      .order('created_at', { ascending: false });

    if (options?.visibility) {
      query = query.eq('visibility', options.visibility);
    }
    if (options?.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }
    if (options?.featured !== undefined) {
      query = query.eq('featured', options.featured);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data || []).map(fromDb), error: null };
  },

  async fetchById(id: string): Promise<GalleryItem | null> {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*, profiles!gallery_items_created_by_fkey(name, avatar_url)')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return fromDb(data);
  },

  async create(item: {
    title: string;
    description?: string;
    category: GalleryCategory;
    event_date?: string;
    location?: string;
    image_url?: string;
    visibility?: GalleryVisibility;
    featured?: boolean;
  }): Promise<{ data: GalleryItem | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        title: item.title,
        description: item.description || '',
        category: item.category,
        event_date: item.event_date || '',
        location: item.location || '',
        image_url: item.image_url || '',
        created_by: user?.id,
        visibility: item.visibility || 'published',
        featured: item.featured || false,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: fromDb(data), error: null };
  },

  async update(id: string, updates: Partial<GalleryItem>): Promise<{ data: GalleryItem | null; error: string | null }> {
    const row: Record<string, any> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.event_date !== undefined) row.event_date = updates.event_date;
    if (updates.location !== undefined) row.location = updates.location;
    if (updates.image_url !== undefined) row.image_url = updates.image_url;
    if (updates.visibility !== undefined) row.visibility = updates.visibility;
    if (updates.featured !== undefined) row.featured = updates.featured;

    const { data, error } = await supabase
      .from('gallery_items')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: fromDb(data), error: null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { data: item } = await supabase
      .from('gallery_items')
      .select('image_url')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };

    if (item?.image_url && item.image_url.startsWith('http')) {
      storageService.delete('gallery-images', item.image_url).catch(() => {});
    }

    return { error: null };
  },

  async incrementViewCount(id: string): Promise<void> {
    await supabase.rpc('increment_gallery_view_count', { p_id: id });
  },

  async uploadImage(userId: string, file: File): Promise<string> {
    const path = await storageService.uploadGalleryImage(userId, file);
    const { data } = storageService.getPublicUrl('gallery-images', path);
    return data.publicUrl;
  },

  async getActivityLog(): Promise<{ data: any[]; error: string | null }> {
    const { data, error } = await supabase
      .from('gallery_activity_log')
      .select('*, profiles!gallery_activity_log_user_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { data: [], error: error.message };
    return {
      data: (data || []).map((r: any) => ({
        ...r,
        actor_name: r.profiles?.name,
      })),
      error: null,
    };
  },
};
