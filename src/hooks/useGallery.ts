import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { GalleryItem, GalleryCategory } from '../interfaces/gallery.interface';
import { galleryService } from '../services/galleryService';
import { useRealtimeData } from './useRealtimeData';
import { QK, STALE_TIMES } from '../constants/queryKeys';

export const useGallery = (options?: {
  visibility?: 'published' | 'draft' | 'archived';
  category?: GalleryCategory | 'All';
}) => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'gallery_items', queryKey: [QK.gallery] },
  ]);

  const queryKey = options?.visibility
    ? [QK.gallery, options.visibility]
    : [QK.gallery];

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await galleryService.fetchAll(options);
      return data || [];
    },
    staleTime: STALE_TIMES.slow,
  });

  const addItem = useMutation({
    mutationFn: (item: {
      title: string;
      description?: string;
      category: GalleryCategory;
      event_date?: string;
      location?: string;
      image_url?: string;
      visibility?: 'published' | 'draft' | 'archived';
      featured?: boolean;
    }) => galleryService.create(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.gallery] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GalleryItem> }) =>
      galleryService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.gallery] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => galleryService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.gallery] }),
  });

  const incrementView = useMutation({
    mutationFn: (id: string) => galleryService.incrementViewCount(id),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QK.gallery] });
  }, [queryClient]);

  return {
    items,
    loading,
    addItem: addItem.mutateAsync,
    updateItem: (id: string, updates: Partial<GalleryItem>) => updateItem.mutateAsync({ id, updates }),
    deleteItem: deleteItem.mutateAsync,
    incrementView: incrementView.mutateAsync,
    isPending: addItem.isPending || updateItem.isPending || deleteItem.isPending,
    refresh,
    addError: addItem.error,
    updateError: updateItem.error,
    deleteError: deleteItem.error,
  };
};
