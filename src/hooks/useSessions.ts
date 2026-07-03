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
    mutationFn: (session: Omit<Session, 'id'>) => sessionService.insert(session),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const updateSession = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Session> }) => sessionService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => sessionService.delete(id),
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
