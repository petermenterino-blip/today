import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResourceLink } from '../types';
import { resourceService } from '../services/resourceService';
import { useRealtimeData } from './useRealtimeData';

export const useResources = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'resources', queryKey: ['resources'] }]);

  const { data: resources = [], isLoading: loading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data } = await resourceService.fetchAll();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addResource = useMutation({
    mutationFn: (resource: Omit<ResourceLink, 'id' | 'is_pinned'>) => resourceService.insert(resource),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] })
  });

  const deleteResource = useMutation({
    mutationFn: (id: string) => resourceService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] })
  });

  return { 
    resources, 
    loading, 
    addResource: addResource.mutateAsync, 
    deleteResource: deleteResource.mutateAsync, 
    refresh: () => queryClient.invalidateQueries({ queryKey: ['resources'] })
  };
};
