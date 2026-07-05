import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { journalStorage } from '../services/journalStorage';
import { JournalEntry } from '../interfaces';
import { useRealtimeData } from './useRealtimeData';

export const useJournals = (studentId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['journals', studentId];

  useRealtimeData([{ table: 'journals', queryKey: ['journals'], filter: studentId ? { column: 'student_id', value: studentId } : undefined }]);

  const { data: journals = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () =>
      studentId
        ? journalStorage.getByStudentId(studentId)
        : journalStorage.getAll(),
    staleTime: STALE_TIMES.normal,
  });

  const addJournal = useMutation({
    mutationFn: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      journalStorage.create(entry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journals'] })
  });

  const updateJournal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<JournalEntry> }) =>
      journalStorage.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journals'] })
  });

  return {
    journals,
    loading,
    addJournal: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      addJournal.mutateAsync(entry),
    updateJournal: (id: string, updates: Partial<JournalEntry>) =>
      updateJournal.mutateAsync({ id, updates }),
    refresh: () => queryClient.invalidateQueries({ queryKey: ['journals'] })
  };
};
