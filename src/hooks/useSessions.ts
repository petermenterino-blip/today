import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';
import { Session } from '../interfaces';
import { useRealtimeData } from './useRealtimeData';

export const useSessions = (userId?: string, role?: 'student' | 'mentor') => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'sessions', queryKey: ['sessions'], filter: userId ? { column: role === 'mentor' ? 'mentor_id' : 'student_id', value: userId } : undefined }]);

  const { data: allSessions = [], isLoading: loading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await sessionService.fetchAll();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sessions = allSessions.filter(s => {
    if (userId && role === 'student') return s.studentId === userId;
    if (userId && role === 'mentor') return s.mentorId === userId;
    return true;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const addSession = useMutation({
    mutationFn: async (session: Omit<Session, 'id'>) => {
      const { data, error } = await sessionService.insert(session);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Session> }) => {
      const { data, error } = await sessionService.update(id, updates);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sessionService.delete(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  return {
    sessions,
    loading,
    addSession: addSession.mutateAsync,
    updateSession: (id: string, updates: Partial<Session>) => updateSession.mutateAsync({ id, updates }),
    deleteSession: deleteSession.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  };
};
