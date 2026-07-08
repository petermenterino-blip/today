import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { ProgramModule } from '../types';
import { programModuleService } from '../services/programModuleService';

export const useProgramModules = (programId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading: loading } = useQuery({
    queryKey: ['program-modules', programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data } = await programModuleService.fetchByProgram(programId);
      return data || [];
    },
    enabled: !!programId,
    staleTime: STALE_TIMES.normal,
  });

  const addModule = useMutation({
    mutationFn: (module: Omit<ProgramModule, 'id' | 'created_at' | 'updated_at'>) =>
      programModuleService.insert(module),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-modules', programId] })
  });

  const updateModule = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProgramModule> }) =>
      programModuleService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-modules', programId] })
  });

  const deleteModule = useMutation({
    mutationFn: (id: string) => programModuleService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-modules', programId] })
  });

  const reorderModules = useMutation({
    mutationFn: (moduleIds: string[]) =>
      programModuleService.reorder(programId!, moduleIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-modules', programId] })
  });

  return {
    modules,
    loading,
    addModule: addModule.mutateAsync,
    updateModule: updateModule.mutateAsync,
    deleteModule: deleteModule.mutateAsync,
    reorderModules: reorderModules.mutateAsync,
  };
};
