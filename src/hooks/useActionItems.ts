import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskStorage } from '../services/taskStorage';
import { ActionItem } from '../interfaces';

export const useActionItems = (userId?: string, role?: 'student' | 'mentor') => {
  const queryClient = useQueryClient();
  const queryKey = ['actionItems', userId, role];

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      let data: ActionItem[];
      if (userId && role === 'student') {
        data = await taskStorage.getByStudentId(userId);
      } else if (userId && role === 'mentor') {
        data = await taskStorage.getByMentorId(userId);
      } else {
        data = await taskStorage.getAll();
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const addTask = useMutation({
    mutationFn: (task: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) =>
      taskStorage.create(task),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionItems'] })
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ActionItem> }) =>
      taskStorage.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionItems'] })
  });

  return {
    tasks,
    loading,
    addTask: (task: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => addTask.mutateAsync(task),
    updateTask: (id: string, updates: Partial<ActionItem>) => updateTask.mutateAsync({ id, updates }),
    refresh: () => queryClient.invalidateQueries({ queryKey: ['actionItems'] })
  };
};
