import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 5 * 60 * 1000,
  });

  const addProgram = useMutation({
    mutationFn: (program: Omit<Program, 'id' | 'progress' | 'status'>) => programService.insert(program),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const deleteProgram = useMutation({
    mutationFn: (id: string) => programService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, program }: { id: string, program: Partial<Program> }) => programService.update(id, program),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  return { 
    programs, 
    loading, 
    addProgram: addProgram.mutateAsync, 
    deleteProgram: deleteProgram.mutateAsync, 
    updateProgram: updateProgram.mutateAsync 
  };
};
