export type ResourceSourceType = 'upload' | 'link' | 'youtube' | 'github' | 'googledrive' | 'notion' | 'figma' | 'canva' | 'website';
export type ResourceStatus = 'active' | 'archived' | 'draft';
export type ResourceVisibility = 'visible' | 'hidden';
export type ResourceFileType = 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'zip' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'svg' | 'mp4' | 'webm' | 'mov' | 'mp3' | 'wav' | 'ogg' | 'txt' | 'md' | 'csv' | 'json' | 'link' | 'other';

export interface Resource {
  id: string;
  title: string;
  url?: string | null;
  description?: string | null;
  category?: string | null;
  file_type?: ResourceFileType | null;
  file_size?: number;
  file_path?: string | null;
  thumbnail_url?: string | null;
  duration?: string | null;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  featured: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  version: number;
  downloads_count: number;
  views_count: number;
  favorites_count: number;
  completions_count: number;
  lesson_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  external_url?: string | null;
  source_type?: ResourceSourceType | null;
  tags: string[];
  program_ids: string[];
  student_ids: string[];

  creator?: { id: string; name: string; email: string } | null;
  category_data?: ResourceCategory | null;
  is_favorited?: boolean;
  is_bookmarked?: boolean;
  is_completed?: boolean;
}

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color: string;
  parent_id?: string | null;
  sort_order: number;
  is_archived: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceAssignment {
  id: string;
  resource_id: string;
  student_id?: string | null;
  program_id?: string | null;
  assigned_by?: string | null;
  assigned_at: string;

  student?: { id: string; name: string; email: string } | null;
  program?: { id: string; title: string } | null;
}

export interface ResourceView {
  id: string;
  resource_id: string;
  user_id?: string | null;
  viewed_at: string;
}

export interface ResourceDownload {
  id: string;
  resource_id: string;
  user_id?: string | null;
  downloaded_at: string;
}

export interface ResourceFavorite {
  id: string;
  resource_id: string;
  user_id: string;
  bookmarked: boolean;
  created_at: string;

  resource?: Resource | null;
}

export interface ResourceComment {
  id: string;
  resource_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  mentions: string[];
  edited_at?: string | null;
  created_at: string;
  deleted_at?: string | null;

  user?: { id: string; name: string; email: string; avatar_url?: string } | null;
  replies?: ResourceComment[];
}

export interface ResourceVersion {
  id: string;
  resource_id: string;
  version_number: number;
  title?: string | null;
  description?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number;
  external_url?: string | null;
  created_by?: string | null;
  change_notes?: string | null;
  created_at: string;
}

export interface ResourceActivity {
  id: string;
  resource_id: string;
  user_id?: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;

  user?: { id: string; name: string } | null;
}

export interface ResourceFilters {
  search?: string;
  category?: string;
  program?: string;
  type?: string;
  uploadedBy?: string;
  sortBy?: 'newest' | 'oldest' | 'most_downloaded' | 'most_viewed' | 'most_favorited' | 'pinned' | 'recently_updated';
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  featured?: boolean;
  tag?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface ResourceCompletion {
  id: string;
  resource_id: string;
  user_id: string;
  completed_at: string;
}

export interface RecentlyViewed {
  id: string;
  user_id: string;
  resource_id: string;
  viewed_at: string;
  resource?: Resource | null;
}

export interface ResourceFilters {
  search?: string;
  category?: string;
  program?: string;
  type?: string;
  uploadedBy?: string;
  sortBy?: 'newest' | 'oldest' | 'most_downloaded' | 'most_viewed' | 'most_favorited' | 'pinned' | 'recently_updated';
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  featured?: boolean;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ResourceStats {
  totalResources: number;
  totalDownloads: number;
  totalViews: number;
  totalFavorites: number;
  totalCategories: number;
  recentlyAdded: number;
  mostDownloaded: Resource[];
  mostViewed: Resource[];
}
