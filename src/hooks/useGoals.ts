import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalStorage } from '../services/goalStorage';
import { Goal } from '../interfaces';
import { useRealtimeData } from './useRealtimeData';

export const useGoals = (studentId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['goals', studentId];

  useRealtimeData([{ table: 'goals', queryKey: ['goals'], filter: studentId ? { column: 'student_id', value: studentId } : undefined }]);

  const { data: goals = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () =>
      studentId
        ? goalStorage.getByStudentId(studentId)
        : goalStorage.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const addGoal = useMutation({
    mutationFn: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) =>
      goalStorage.create(goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Goal> }) =>
      goalStorage.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => goalStorage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  return {
    goals,
    loading,
    addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => addGoal.mutateAsync(goal),
    updateGoal: (id: string, updates: Partial<Goal>) => updateGoal.mutateAsync({ id, updates }),
    deleteGoal: (id: string) => deleteGoal.mutateAsync(id),
    refresh: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  };
};
