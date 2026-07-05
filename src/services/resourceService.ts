import { supabase } from '../lib/supabase';
import { handleError } from '../lib/serviceHelper';
import { notificationStorage } from './notificationStorage';
import type {
  Resource, ResourceCategory, ResourceAssignment, ResourceView,
  ResourceDownload, ResourceFavorite, ResourceComment, ResourceVersion,
  ResourceActivity, ResourceFilters, ResourceStats, PaginatedResult
} from '../types/resources';

const RESOURCE_SELECT = `
  id,title,description,url,category,file_type,file_size,file_path,thumbnail_url,duration,source_type,external_url,tags,program_ids,student_ids,status,visibility,featured,is_pinned,is_archived,version,views_count,downloads_count,favorites_count,completions_count,created_by,created_at,updated_at,deleted_at,
  creator:created_by(id, name:full_name, email),
  category_data:category(id, name, slug, icon, color)
`;

function applyFilters(query: any, filters?: ResourceFilters) {
  if (!filters) return query;

  if (filters.search) {
    const s = `%${filters.search}%`;
    query = query.or(`title.ilike.${s},description.ilike.${s},tags.cs.{${filters.search}}`);
  }
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.program) query = query.contains('program_ids', [filters.program]);
  if (filters.type) query = query.eq('file_type', filters.type);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.visibility) query = query.eq('visibility', filters.visibility);
  if (filters.featured) query = query.eq('featured', true);
  if (filters.tag) query = query.contains('tags', [filters.tag]);

  switch (filters.sortBy) {
    case 'oldest': query = query.order('created_at', { ascending: true }); break;
    case 'most_downloaded': query = query.order('downloads_count', { ascending: false }); break;
    case 'most_viewed': query = query.order('views_count', { ascending: false }); break;
    case 'most_favorited': query = query.order('favorites_count', { ascending: false }); break;
    case 'pinned': query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }); break;
    case 'recently_updated': query = query.order('updated_at', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  return query;
}

function rowToResource(row: any): Resource {
  return {
    ...row,
    tags: row.tags || [],
    program_ids: row.program_ids || [],
    student_ids: row.student_ids || [],
    is_favorited: row.is_favorited || false,
    is_bookmarked: row.is_bookmarked || false,
    is_completed: row.is_completed || false,
    completions_count: row.completions_count || 0,
  };
}

export const resourceService = {

  // ========================
  // RESOURCES CRUD
  // ========================

  async fetchAll(filters?: ResourceFilters): Promise<{ data: Resource[] | null; error: string | null; count?: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let countQuery = supabase.from('resources').select('*', { count: 'exact', head: true });
    countQuery = applyFilters(countQuery, filters);
    const { count } = await countQuery;

    let query = supabase.from('resources').select(RESOURCE_SELECT);
    query = applyFilters(query, filters);
    query = query.range(from, to);
    const { data, error } = await query;
    if (error) return { data: null as Resource[] | null, error: handleError(error).error };
    return { data: (data || []).map(rowToResource), error: null, count: count || 0 };
  },

  async fetchById(id: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('id', id)
      .single();
    if (error) return { data: null as Resource | null, error: handleError(error).error };
    return { data: rowToResource(data), error: null };
  },

  async create(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'views_count' | 'downloads_count' | 'favorites_count' | 'version' | 'is_favorited' | 'is_bookmarked' | 'creator' | 'category_data'>) {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        ...resource,
        created_by: resource.created_by || (await supabase.auth.getUser()).data.user?.id,
        version: 1,
      })
      .select(RESOURCE_SELECT)
      .single();
    if (error) return { data: null as Resource | null, error: handleError(error).error };

    const created = rowToResource(data);
    this.notifyResourceCreated(created).catch(() => {});

    return { data: created, error: null };
  },

  async update(id: string, updates: Partial<Resource>) {
    const cleanUpdates = { ...updates };
    delete (cleanUpdates as any).id;
    delete (cleanUpdates as any).created_at;
    delete (cleanUpdates as any).creator;
    delete (cleanUpdates as any).category_data;
    delete (cleanUpdates as any).is_favorited;
    delete (cleanUpdates as any).is_bookmarked;

    const { data, error } = await supabase
      .from('resources')
      .update(cleanUpdates)
      .eq('id', id)
      .select(RESOURCE_SELECT)
      .single();
    if (error) return { data: null as Resource | null, error: handleError(error).error };
    return { data: rowToResource(data), error: null };
  },

  async softDelete(id: string) {
    const { data, error } = await supabase
      .from('resources')
      .update({ deleted_at: new Date().toISOString(), status: 'archived', is_archived: true })
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async hardDelete(id: string) {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  async restore(id: string) {
    const { data, error } = await supabase
      .from('resources')
      .update({ deleted_at: null, status: 'active', is_archived: false })
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async duplicate(id: string, userId: string) {
    const { data: original, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !original) return { data: null, error: 'Original resource not found' };

    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: `${original.title} (Copy)`,
        description: original.description,
        url: original.url,
        category: original.category,
        file_type: original.file_type,
        file_size: original.file_size,
        file_path: original.file_path,
        thumbnail_url: original.thumbnail_url,
        duration: original.duration,
        source_type: original.source_type,
        external_url: original.external_url,
        tags: original.tags,
        program_ids: original.program_ids,
        student_ids: original.student_ids,
        created_by: userId,
        version: 1,
      })
      .select(RESOURCE_SELECT)
      .single();
    if (error) return { data: null as Resource | null, error: handleError(error).error };
    return { data: rowToResource(data), error: null };
  },

  async replaceFile(id: string, filePath: string, fileType: string, fileSize: number) {
    const { data: current, error: fetchError } = await supabase
      .from('resources')
      .select('version, file_path, file_type, file_size')
      .eq('id', id)
      .single();
    if (fetchError) return { data: null, error: 'Resource not found' };

    await supabase.from('resource_versions').insert({
      resource_id: id,
      version_number: (current?.version || 1) + 1,
      file_path: current?.file_path,
      file_type: current?.file_type,
      file_size: current?.file_size || 0,
      change_notes: 'File replaced',
    });

    const { data, error } = await supabase
      .from('resources')
      .update({
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        version: (current?.version || 1) + 1,
      })
      .eq('id', id)
      .select(RESOURCE_SELECT)
      .single();
    if (error) return { data: null as Resource | null, error: handleError(error).error };
    return { data: rowToResource(data), error: null };
  },

  // ========================
  // STORAGE OPERATIONS
  // ========================

  async uploadFile(file: File, bucket = 'mentor-resources') {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return { data: null as string | null, error: 'Not authenticated' };

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${timestamp}_${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) return { data: null as string | null, error: `Upload failed: ${error.message}` };

    return { data: path, error: null };
  },

  async getFileUrl(path: string, bucket = 'mentor-resources', expiresIn = 3600) {
    if (!path) return { data: null as string | null, error: 'No path provided' };
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) return { data: null as string | null, error: error.message };
    return { data: data.signedUrl, error: null };
  },

  async getSignedUrl(path: string, bucket = 'mentor-resources', expiresIn = 300) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) return { data: null as string | null, error: error.message };
    return { data: data.signedUrl, error: null };
  },

  async deleteFile(path: string, bucket = 'mentor-resources') {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return { error: `Delete failed: ${error.message}` };
    return { error: null };
  },

  // ========================
  // TRACKING
  // ========================

  async trackView(resourceId: string, userId?: string | null) {
    const { error } = await supabase.from('resource_views').insert({
      resource_id: resourceId,
      user_id: userId || (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  async trackDownload(resourceId: string, userId?: string | null) {
    const { error } = await supabase.from('resource_downloads').insert({
      resource_id: resourceId,
      user_id: userId || (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  // ========================
  // FAVORITES
  // ========================

  async toggleFavorite(resourceId: string, userId: string) {
    const existing = await supabase
      .from('resource_favorites')
      .select('id, bookmarked')
      .eq('resource_id', resourceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing.data) {
      const newBookmarked = !existing.data.bookmarked;
      const { error } = await supabase
        .from('resource_favorites')
        .update({ bookmarked: newBookmarked })
        .eq('id', existing.data.id);
      if (error) return { data: null, error: handleError(error).error, bookmarked: false };

      const delta = newBookmarked ? 1 : -1;
      await supabase.rpc('increment_resource_field', { row_id: resourceId, field: 'favorites_count', delta });

      return { data: existing.data, error: null, bookmarked: newBookmarked };
    }

    const { data, error } = await supabase
      .from('resource_favorites')
      .insert({ resource_id: resourceId, user_id: userId, bookmarked: true })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error, bookmarked: false };

    await supabase.rpc('increment_resource_field', { row_id: resourceId, field: 'favorites_count', delta: 1 });

    return { data, error: null, bookmarked: true };
  },

  async getUserFavorites(userId: string) {
    const { data, error } = await supabase
      .from('resource_favorites')
      .select(`*, resource:resource_id(${RESOURCE_SELECT})`)
      .eq('user_id', userId)
      .eq('bookmarked', true);
    if (error) return { data: null as ResourceFavorite[] | null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  // ========================
  // CATEGORIES
  // ========================

  async fetchCategories() {
    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });
    if (error) return { data: null as ResourceCategory[] | null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  async createCategory(category: Omit<ResourceCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('resource_categories')
      .insert(category)
      .select()
      .single();
    if (error) return { data: null as ResourceCategory | null, error: handleError(error).error };
    return { data, error: null };
  },

  async updateCategory(id: string, updates: Partial<ResourceCategory>) {
    const { data, error } = await supabase
      .from('resource_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null as ResourceCategory | null, error: handleError(error).error };
    return { data, error: null };
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('resource_categories').update({ is_archived: true }).eq('id', id);
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  async mergeCategories(sourceId: string, targetId: string) {
    await supabase.from('resources').update({ category: targetId }).eq('category', sourceId);
    const { error } = await supabase.from('resource_categories').update({ is_archived: true }).eq('id', sourceId);
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  // ========================
  // ASSIGNMENTS
  // ========================

  async assignToStudent(resourceId: string, studentId: string, assignedBy: string) {
    const { data, error } = await supabase
      .from('resource_assignments')
      .insert({ resource_id: resourceId, student_id: studentId, assigned_by: assignedBy })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };

    await supabase.from('resource_activity').insert({
      resource_id: resourceId, user_id: assignedBy, action: 'assigned',
      details: { student_id: studentId },
    });

    return { data, error: null };
  },

  async assignToProgram(resourceId: string, programId: string, assignedBy: string) {
    const { data, error } = await supabase
      .from('resource_assignments')
      .insert({ resource_id: resourceId, program_id: programId, assigned_by: assignedBy })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };

    const { data: enrollmentData } = await supabase
      .from('program_enrollments')
      .select('student_id')
      .eq('program_id', programId);

    if (enrollmentData && enrollmentData.length > 0) {
      const studentIds = enrollmentData.map(e => e.student_id);
      const batch = studentIds.map(student_id => ({
        resource_id: resourceId, student_id, assigned_by: assignedBy,
      }));
      if (batch.length > 0) {
        await supabase.from('resource_assignments').insert(batch);
      }
    }

    return { data, error: null };
  },

  async removeAssignment(assignmentId: string) {
    const { error } = await supabase.from('resource_assignments').delete().eq('id', assignmentId);
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  async getResourceAssignments(resourceId: string) {
    const { data, error } = await supabase
      .from('resource_assignments')
      .select(`*, student:student_id(id, name:full_name, email), program:program_id(id, title)`)
      .eq('resource_id', resourceId);
    if (error) return { data: null as ResourceAssignment[] | null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  async getStudentResources(studentId: string) {
    const { data: assignmentData } = await supabase
      .from('resource_assignments')
      .select('resource_id')
      .eq('student_id', studentId);

    const resourceIds = (assignmentData || []).map(a => a.resource_id);
    if (resourceIds.length === 0) return { data: [] as Resource[], error: null };

    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .in('id', resourceIds)
      .eq('status', 'active')
      .eq('visibility', 'visible')
      .order('created_at', { ascending: false });
    if (error) return { data: null as Resource[] | null, error: handleError(error).error };
    return { data: (data || []).map(rowToResource), error: null };
  },

  // ========================
  // COMPLETIONS
  // ========================

  async markComplete(resourceId: string, userId: string) {
    const { data, error } = await supabase
      .from('resource_completions')
      .insert({ resource_id: resourceId, user_id: userId })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async getCompletions(userId: string) {
    const { data, error } = await supabase
      .from('resource_completions')
      .select('*, resource:resource_id(*)')
      .eq('user_id', userId);
    if (error) return { data: null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  async getResourceCompletions(resourceId: string) {
    const { data, error } = await supabase
      .from('resource_completions')
      .select('*, user:user_id(id, name:full_name, email)')
      .eq('resource_id', resourceId);
    if (error) return { data: null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  // ========================
  // RECENTLY VIEWED
  // ========================

  async trackRecentlyViewed(resourceId: string, userId: string) {
    await supabase.rpc('upsert_recently_viewed', { p_user_id: userId, p_resource_id: resourceId });
  },

  async getRecentlyViewed(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('recently_viewed')
      .select(`*, resource:resource_id(${RESOURCE_SELECT})`)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);
    if (error) return { data: null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  // ========================
  // NOTIFICATIONS
  // ========================

  async sendResourceNotification(userId: string, title: string, message: string, link?: string) {
    notificationStorage.create({
      userId,
      title,
      message,
      type: 'resource' as any,
      link: link || '/resources',
    }).catch(() => {});
  },

  async notifyResourceCreated(resource: Resource) {
    if (resource.student_ids && resource.student_ids.length > 0) {
      for (const sid of resource.student_ids) {
        this.sendResourceNotification(sid, 'New Resource',
          `"${resource.title}" has been added for you`,
          `/student/resources`);
      }
    }
    if (resource.program_ids && resource.program_ids.length > 0) {
      const { data: enrollments } = await supabase
        .from('program_enrollments')
        .select('student_id')
        .in('program_id', resource.program_ids);
      if (enrollments) {
        const sent = new Set<string>();
        for (const e of enrollments) {
          if (!sent.has(e.student_id) && !resource.student_ids?.includes(e.student_id)) {
            sent.add(e.student_id);
            this.sendResourceNotification(e.student_id, 'New Resource',
              `New resource available in your program: "${resource.title}"`,
              `/student/resources`);
          }
        }
      }
    }
  },

  // ========================
  // COMMENTS
  // ========================

  async getComments(resourceId: string) {
    const { data, error } = await supabase
      .from('resource_comments')
      .select(`*, user:user_id(id, name:full_name, email)`)
      .eq('resource_id', resourceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) return { data: null as ResourceComment[] | null, error: handleError(error).error };
    const comments = (data || []) as ResourceComment[];
    const topLevel = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    const threaded = topLevel.map(c => ({ ...c, replies: replies.filter(r => r.parent_id === c.id) }));
    return { data: threaded, error: null };
  },

  async addComment(resourceId: string, userId: string, content: string, parentId?: string) {
    const { data, error } = await supabase
      .from('resource_comments')
      .insert({ resource_id: resourceId, user_id: userId, content, parent_id: parentId || null })
      .select(`*, user:user_id(id, name:full_name, email)`)
      .single();
    if (error) return { data: null as ResourceComment | null, error: handleError(error).error };
    return { data: data as ResourceComment, error: null };
  },

  async updateComment(commentId: string, content: string) {
    const { data, error } = await supabase
      .from('resource_comments')
      .update({ content, edited_at: new Date().toISOString() })
      .eq('id', commentId)
      .select(`*, user:user_id(id, name:full_name, email)`)
      .single();
    if (error) return { data: null as ResourceComment | null, error: handleError(error).error };
    return { data: data as ResourceComment, error: null };
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('resource_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  // ========================
  // VERSIONS
  // ========================

  async getVersions(resourceId: string) {
    const { data, error } = await supabase
      .from('resource_versions')
      .select('*')
      .eq('resource_id', resourceId)
      .order('version_number', { ascending: false });
    if (error) return { data: null as ResourceVersion[] | null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  async restoreVersion(versionId: string, resourceId: string) {
    const { data: version } = await supabase
      .from('resource_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (!version) return { data: null, error: 'Version not found' };

    const { data: current } = await supabase
      .from('resources')
      .select('file_path, file_type, file_size, version')
      .eq('id', resourceId)
      .single();

    await supabase.from('resource_versions').insert({
      resource_id: resourceId,
      version_number: (current?.version || 1) + 1,
      file_path: current?.file_path,
      file_type: current?.file_type,
      file_size: current?.file_size || 0,
      change_notes: `Restored from version ${version.version_number}`,
    });

    const { data, error } = await supabase
      .from('resources')
      .update({
        file_path: version.file_path,
        file_type: version.file_type,
        file_size: version.file_size || 0,
        version: (current?.version || 1) + 1,
      })
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single();
    if (error) return { data: null as Resource | null, error: handleError(error).error };
    return { data: rowToResource(data), error: null };
  },

  // ========================
  // ACTIVITY
  // ========================

  async getActivity(resourceId: string) {
    const { data, error } = await supabase
      .from('resource_activity')
      .select(`*, user:user_id(id, name:full_name)`)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { data: null as ResourceActivity[] | null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  async logActivity(resourceId: string, userId: string, action: string, details: Record<string, any> = {}) {
    const { error } = await supabase.from('resource_activity').insert({
      resource_id: resourceId, user_id: userId, action, details,
    });
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  // ========================
  // STATS / ANALYTICS
  // ========================

  async getStats() {
    const { data: all } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT, { count: 'exact', head: false })
      .order('downloads_count', { ascending: false })
      .limit(100);

    const allRows = all || [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const recentlyAdded = allRows.filter(r => r.created_at >= weekAgo).length;
    const totalDownloads = allRows.reduce((sum, r) => sum + (r.downloads_count || 0), 0);
    const totalViews = allRows.reduce((sum, r) => sum + (r.views_count || 0), 0);
    const totalFavorites = allRows.reduce((sum, r) => sum + (r.favorites_count || 0), 0);

    const mostDownloaded = [...allRows]
      .sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
      .slice(0, 5)
      .map(rowToResource);

    const mostViewed = [...allRows]
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 5)
      .map(rowToResource);

    return {
      data: {
        totalResources: all.length,
        totalDownloads,
        totalViews,
        totalFavorites,
        totalCategories: 0,
        recentlyAdded,
        mostDownloaded,
        mostViewed,
      } as ResourceStats,
      error: null,
    };
  },

  // ========================
  // SEARCH (advanced)
  // ========================

  async search(query: string, limit = 20) {
    const s = `%${query}%`;
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .or(`title.ilike.${s},description.ilike.${s},tags.cs.{${query}}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { data: null as Resource[] | null, error: handleError(error).error };
    return { data: (data || []).map(rowToResource), error: null };
  },

  // ========================
  // RELATED RESOURCES
  // ========================

  async getRelated(resourceId: string, limit = 4) {
    const { data: current } = await supabase
      .from('resources')
      .select('category, tags')
      .eq('id', resourceId)
      .single();
    if (!current) return { data: [] as Resource[], error: null };

    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .neq('id', resourceId)
      .eq('status', 'active')
      .limit(limit);

    if (current.category) {
      query = query.eq('category', current.category);
    } else if (current.tags && current.tags.length > 0) {
      query = query.contains('tags', [current.tags[0]]);
    }

    const { data, error } = await query;
    if (error) return { data: null as Resource[] | null, error: handleError(error).error };
    return { data: (data || []).map(rowToResource), error: null };
  },
};

export const createResourceRpc = async () => {
  await supabase.rpc('create_increment_function');
};
