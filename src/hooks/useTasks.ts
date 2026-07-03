import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { taskService } from '../services/taskService';
import { TaskActivity } from '../types';
import { useRealtimeData } from './useRealtimeData';

export const useTasks = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'tasks', queryKey: ['tasks'] }]);

  const { data: taskActivities = [], isLoading: loading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await taskService.fetchAll();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addTask = useMutation({
    mutationFn: (activity: Omit<TaskActivity, 'id' | 'created_at'>) => taskService.insert(activity),
    onSuccess: (_, activity) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (activity.user_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', activity.user_id] });
      }
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, response }: { id: string; status: TaskActivity['status']; response?: string }) =>
      taskService.updateStatus(id, status, response),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskActivity> }) =>
      taskService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const fetchUserTasks = useCallback(async (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  return {
    taskActivities,
    loading,
    addTask: addTask.mutateAsync,
    updateStatus: (id: string, status: TaskActivity['status'], response?: string) =>
      updateStatus.mutateAsync({ id, status, response }),
    updateTask: (id: string, updates: Partial<TaskActivity>) =>
      updateTask.mutateAsync({ id, updates }),
    deleteTask: deleteTask.mutateAsync,
    refresh,
    refreshUser: fetchUserTasks,
  };
};
