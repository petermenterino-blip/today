export type GalleryCategory = 'Careers' | 'Academic' | 'Ceremonies' | 'Virtual';
export type GalleryVisibility = 'published' | 'draft' | 'archived';

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: GalleryCategory;
  event_date: string;
  location: string;
  image_url: string;
  created_by?: string;
  visibility: GalleryVisibility;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;

  creator_name?: string;
  creator_avatar?: string;
}

export interface GalleryActivityLog {
  id: string;
  gallery_id?: string;
  action: string;
  user_id?: string;
  changes: Record<string, any>;
  created_at: string;

  actor_name?: string;
}
