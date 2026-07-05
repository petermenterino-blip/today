import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { STALE_TIMES } from '../constants/queryKeys';
import { applicationService } from '../services/applicationService';
import { Application } from '../types';
import { useRealtimeData } from './useRealtimeData';

export const useApplications = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'applications', queryKey: ['applications'] }]);

  const { data: applications = [], isLoading: loading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data } = await applicationService.fetchAll();
      return data?.data || [];
    },
    staleTime: STALE_TIMES.frequent,
  });

  const refresh = useCallback(async (params?: { search?: string; status?: string; discipline?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) => {
    await queryClient.invalidateQueries({ queryKey: ['applications'] });
    if (params) {
      const { data } = await applicationService.fetchAll(params);
      if (data) {
        queryClient.setQueryData(['applications'], data.data || []);
      }
    }
  }, [queryClient]);

  const addApplication = useMutation({
    mutationFn: (app: Omit<Application, 'id' | 'created_at' | 'status'>) => applicationService.submitApplication(app),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => applicationService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] })
  });

  const deleteApplication = useMutation({
    mutationFn: (id: string) => applicationService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] })
  });

  return { 
    applications, 
    totalCount: applications.length,
    loading, 
    addApplication: addApplication.mutateAsync, 
    updateStatus: (id: string, status: 'approved' | 'rejected') => updateStatus.mutateAsync({ id, status }), 
    deleteApplication: deleteApplication.mutateAsync, 
    refresh 
  };
};
