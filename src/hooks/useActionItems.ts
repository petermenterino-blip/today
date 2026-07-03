import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import { useRealtimeData } from './useRealtimeData';
import { TaskActivity } from '../types';

export const useActionItems = (userId?: string, role?: 'student' | 'mentor') => {
  const queryClient = useQueryClient();
  const queryKey = ['actionItems', userId, role];

  useRealtimeData([{ table: 'tasks', queryKey: ['actionItems'] }]);

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (userId) {
        const { data } = await taskService.fetchByUserId(userId);
        return data || [];
      }
      const { data } = await taskService.fetchAll();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addTask = useMutation({
    mutationFn: (activity: Omit<TaskActivity, 'id' | 'created_at'>) =>
      taskService.insert(activity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionItems'] })
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskActivity> }) =>
      taskService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionItems'] })
  });

  return {
    tasks,
    loading,
    addTask: (activity: Omit<TaskActivity, 'id' | 'created_at'>) => addTask.mutateAsync(activity),
    updateTask: (id: string, updates: Partial<TaskActivity>) => updateTask.mutateAsync({ id, updates }),
    refresh: () => queryClient.invalidateQueries({ queryKey: ['actionItems'] })
  };
};
