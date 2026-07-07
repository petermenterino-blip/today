import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { contactSubmissionService, ContactSubmission } from '../services/contactSubmissionService';
import { useRealtimeData } from './useRealtimeData';

const QK_CONTACT_SUBMISSIONS = 'contact_submissions';

export const useContactSubmissions = () => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'contact_submissions', queryKey: [QK_CONTACT_SUBMISSIONS] },
  ]);

  const { data: submissions = [], isLoading: loading } = useQuery({
    queryKey: [QK_CONTACT_SUBMISSIONS],
    queryFn: async () => {
      const result = await contactSubmissionService.fetchAll();
      return result?.data || [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const submit = useMutation({
    mutationFn: (data: Parameters<typeof contactSubmissionService.submit>[0]) =>
      contactSubmissionService.submit(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK_CONTACT_SUBMISSIONS] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactSubmission['status'] }) =>
      contactSubmissionService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK_CONTACT_SUBMISSIONS] }),
  });

  const archive = useMutation({
    mutationFn: (id: string) => contactSubmissionService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK_CONTACT_SUBMISSIONS] }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QK_CONTACT_SUBMISSIONS] });
  }, [queryClient]);

  return {
    submissions,
    loading,
    submit: submit.mutateAsync,
    updateStatus: ({ id, status }: { id: string; status: ContactSubmission['status'] }) =>
      updateStatus.mutateAsync({ id, status }),
    archive: archive.mutateAsync,
    refresh,
    isPending: submit.isPending || updateStatus.isPending,
  };
};
