import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceService } from '../services/resourceService';
import { useRealtimeData } from './useRealtimeData';
import { useAuth } from '../context/AuthContext';
import { notifySuccess, notifyError } from '../utils/toast';
import { QK } from '../constants/queryKeys';
import type {
  Resource, ResourceCategory, ResourceFilters, ResourceComment,
  ResourceVersion, ResourceAssignment, ResourceStats, RecentlyViewed
} from '../types/resources';

export const useResources = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const isMentor = user?.role === 'mentor';

  useRealtimeData([
    { table: 'resources', queryKey: [QK.resources] },
    { table: 'resource_categories', queryKey: [QK.resources, 'categories'] },
    { table: 'resource_assignments', queryKey: [QK.resources, 'assignments'] },
    { table: 'resource_favorites', queryKey: [QK.resources, 'favorites'] },
    { table: 'resource_comments', queryKey: [QK.resources, 'comments'] },
    { table: 'resource_activity', queryKey: [QK.resources, 'activity'] },
    { table: 'resource_completions', queryKey: [QK.resources, 'completions'] },
    { table: 'recently_viewed', queryKey: [QK.resources, 'recently_viewed'] },
  ]);

  // ── Resources list (paginated) ──
  const useResourceList = (filters?: ResourceFilters) => useQuery({
    queryKey: [QK.resources, 'list', filters],
    queryFn: async () => {
      const result = await resourceService.fetchAll(filters);
      return { data: result.data || [], count: result.count || 0 };
    },
    staleTime: 2 * 60 * 1000,
  });

  // ── Single resource ──
  const useResource = (id: string | undefined) => useQuery({
    queryKey: [QK.resources, id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await resourceService.fetchById(id);
      return data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  // ── Categories ──
  const useCategories = () => useQuery({
    queryKey: [QK.resources, 'categories'],
    queryFn: async () => {
      const { data } = await resourceService.fetchCategories();
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Favorites ──
  const useFavorites = () => useQuery({
    queryKey: [QK.resources, 'favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await resourceService.getUserFavorites(userId);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // ── Completions ──
  const useCompletions = () => useQuery({
    queryKey: [QK.resources, 'completions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await resourceService.getCompletions(userId);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // ── Recently Viewed ──
  const useRecentlyViewed = (limit = 10) => useQuery({
    queryKey: [QK.resources, 'recently_viewed', userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await resourceService.getRecentlyViewed(userId, limit);
      return (data || []) as RecentlyViewed[];
    },
    enabled: !!userId,
    staleTime: 10 * 1000,
  });

  // ── Student resources ──
  const useStudentResources = () => useQuery({
    queryKey: [QK.resources, 'student', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await resourceService.getStudentResources(userId);
      return data || [];
    },
    enabled: !!userId && !isMentor,
    staleTime: 30 * 1000,
  });

  // ── Stats ──
  const useStats = () => useQuery({
    queryKey: [QK.resources, 'stats'],
    queryFn: async () => {
      const { data } = await resourceService.getStats();
      return data as ResourceStats;
    },
    staleTime: 60 * 1000,
  });

  // ── Mutations ──
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [QK.resources] });
  };

  const createResource = useMutation({
    mutationFn: (resource: any) => resourceService.create(resource),
    onSuccess: () => { invalidate(); notifySuccess('Resource created'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to create resource'),
  });

  const updateResource = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Resource> }) =>
      resourceService.update(id, updates),
    onSuccess: () => { invalidate(); notifySuccess('Resource updated'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to update resource'),
  });

  const softDeleteResource = useMutation({
    mutationFn: (id: string) => resourceService.softDelete(id),
    onSuccess: () => { invalidate(); notifySuccess('Resource archived'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to archive resource'),
  });

  const hardDeleteResource = useMutation({
    mutationFn: (id: string) => resourceService.hardDelete(id),
    onSuccess: () => { invalidate(); notifySuccess('Resource deleted'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to delete resource'),
  });

  const restoreResource = useMutation({
    mutationFn: (id: string) => resourceService.restore(id),
    onSuccess: () => { invalidate(); notifySuccess('Resource restored'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to restore resource'),
  });

  const duplicateResource = useMutation({
    mutationFn: (id: string) => resourceService.duplicate(id, userId || ''),
    onSuccess: () => { invalidate(); notifySuccess('Resource duplicated'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to duplicate resource'),
  });

  const replaceFile = useMutation({
    mutationFn: ({ id, filePath, fileType, fileSize }: { id: string; filePath: string; fileType: string; fileSize: number }) =>
      resourceService.replaceFile(id, filePath, fileType, fileSize),
    onSuccess: () => { invalidate(); notifySuccess('File replaced'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to replace file'),
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => resourceService.uploadFile(file),
  });

  const toggleFavorite = useMutation({
    mutationFn: (resourceId: string) => resourceService.toggleFavorite(resourceId, userId || ''),
    onSuccess: (result) => {
      invalidate();
      notifySuccess(result.bookmarked ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: (err: any) => notifyError(err?.message || 'Failed to toggle favorite'),
  });

  const addComment = useMutation({
    mutationFn: ({ resourceId, content, parentId }: { resourceId: string; content: string; parentId?: string }) =>
      resourceService.addComment(resourceId, userId || '', content, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.resources, 'comments'] }),
    onError: (err: any) => notifyError(err?.message || 'Failed to add comment'),
  });

  const assignToStudent = useMutation({
    mutationFn: ({ resourceId, studentId }: { resourceId: string; studentId: string }) =>
      resourceService.assignToStudent(resourceId, studentId, userId || ''),
    onSuccess: () => { invalidate(); notifySuccess('Resource assigned'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to assign resource'),
  });

  const assignToProgram = useMutation({
    mutationFn: ({ resourceId, programId }: { resourceId: string; programId: string }) =>
      resourceService.assignToProgram(resourceId, programId, userId || ''),
    onSuccess: () => { invalidate(); notifySuccess('Resource assigned to program'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to assign to program'),
  });

  const removeAssignment = useMutation({
    mutationFn: (assignmentId: string) => resourceService.removeAssignment(assignmentId),
    onSuccess: () => { invalidate(); notifySuccess('Assignment removed'); },
    onError: (err: any) => notifyError(err?.message || 'Failed to remove assignment'),
  });

  // ── Completions ──
  const markComplete = useMutation({
    mutationFn: (resourceId: string) =>
      resourceService.markComplete(resourceId, userId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.resources, 'completions'] });
      notifySuccess('Resource marked as completed');
    },
    onError: (err: any) => notifyError(err?.message || 'Failed to mark complete'),
  });

  // ── Track View ──
  const trackView = useMutation({
    mutationFn: (resourceId: string) =>
      resourceService.trackView(resourceId, userId || ''),
  });

  // ── Track Recently Viewed ──
  const trackRecentlyViewed = useMutation({
    mutationFn: (resourceId: string) =>
      resourceService.trackRecentlyViewed(resourceId, userId || ''),
  });

  // ── Category mutations ──
  const createCategory = useMutation({
    mutationFn: (category: { name: string; slug?: string; description?: string | null; icon?: string | null; color?: string; parent_id?: string | null; sort_order?: number; is_archived?: boolean; created_by?: string | null }) =>
      resourceService.createCategory(category as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.resources, 'categories'] });
      notifySuccess('Category created');
    },
    onError: (err: any) => notifyError(err?.message || 'Failed to create category'),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ResourceCategory> }) =>
      resourceService.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.resources, 'categories'] });
      notifySuccess('Category updated');
    },
    onError: (err: any) => notifyError(err?.message || 'Failed to update category'),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => resourceService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.resources, 'categories'] });
      notifySuccess('Category deleted');
    },
    onError: (err: any) => notifyError(err?.message || 'Failed to delete category'),
  });

  return {
    useResourceList,
    useResource,
    useCategories,
    useFavorites,
    useCompletions,
    useRecentlyViewed,
    useStudentResources,
    useStats,

    createResource: createResource.mutateAsync,
    updateResource: updateResource.mutateAsync,
    softDeleteResource: softDeleteResource.mutateAsync,
    hardDeleteResource: hardDeleteResource.mutateAsync,
    restoreResource: restoreResource.mutateAsync,
    duplicateResource: duplicateResource.mutateAsync,
    replaceFile: replaceFile.mutateAsync,
    uploadFile: uploadFile.mutateAsync,
    toggleFavorite: toggleFavorite.mutateAsync,
    addComment: addComment.mutateAsync,
    assignToStudent: assignToStudent.mutateAsync,
    assignToProgram: assignToProgram.mutateAsync,
    removeAssignment: removeAssignment.mutateAsync,
    markComplete: markComplete.mutateAsync,
    trackView: trackView.mutateAsync,
    trackRecentlyViewed: trackRecentlyViewed.mutateAsync,
    createCategory: createCategory.mutateAsync,
    updateCategory: updateCategory.mutateAsync,
    deleteCategory: deleteCategory.mutateAsync,

    service: resourceService,
    invalidate,
    userId,
    isMentor,
  };
};
