import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalStorage } from '../services/journalStorage';
import { JournalEntry } from '../interfaces';

export const useJournals = (studentId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['journals', studentId];

  const { data: journals = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () =>
      studentId
        ? journalStorage.getByStudentId(studentId)
        : journalStorage.getAll(),
    staleTime: 5 * 60 * 1000,
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
