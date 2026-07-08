import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { Program } from '../types';
import { programService } from '../services/programService';
import { useRealtimeData } from './useRealtimeData';

export const usePrograms = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'programs', queryKey: ['programs'] }]);

  const { data: programs = [], isLoading: loading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await programService.fetchAll();
      return data || [];
    },
    staleTime: STALE_TIMES.slow,
  });

  const addProgram = useMutation({
    mutationFn: (program: Partial<Program>) => programService.insert(program),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const deleteProgram = useMutation({
    mutationFn: (id: string) => programService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, program }: { id: string; program: Partial<Program> }) => programService.update(id, program),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const archiveProgram = useMutation({
    mutationFn: (id: string) => programService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const restoreProgram = useMutation({
    mutationFn: (id: string) => programService.restore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const publishProgram = useMutation({
    mutationFn: (id: string) => programService.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const duplicateProgram = useMutation({
    mutationFn: (id: string) => programService.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const permanentDeleteProgram = useMutation({
    mutationFn: (id: string) => programService.permanentDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  return {
    programs,
    loading,
    addProgram: addProgram.mutateAsync,
    deleteProgram: deleteProgram.mutateAsync,
    updateProgram: updateProgram.mutateAsync,
    archiveProgram: archiveProgram.mutateAsync,
    restoreProgram: restoreProgram.mutateAsync,
    publishProgram: publishProgram.mutateAsync,
    duplicateProgram: duplicateProgram.mutateAsync,
    permanentDeleteProgram: permanentDeleteProgram.mutateAsync,
  };
};
