import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFormService } from '../services/customFormService';
import { useRealtimeData } from './useRealtimeData';
import type { CustomForm, FormSubmission } from '../types';

export const useCustomForms = (userId?: string) => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'custom_forms', queryKey: ['customForms'] },
    { table: 'form_submissions', queryKey: ['formSubmissions'] },
  ]);

  const { data: forms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['customForms'],
    queryFn: () => customFormService.getAllForms(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => customFormService.getAllSubmissions(),
    staleTime: 5 * 60 * 1000,
  });

  const submissions = allSubmissions.filter(s => !userId || s.user_id === userId);

  const submitFormMutation = useMutation({
    mutationFn: (submission: Omit<FormSubmission, 'id' | 'submitted_at'>) =>
      customFormService.submitForm(submission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formSubmissions'] }),
  });

  return {
    forms,
    formsLoading,
    submissions,
    submissionsLoading,
    submitForm: (submission: Omit<FormSubmission, 'id' | 'submitted_at'>) => submitFormMutation.mutateAsync(submission),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['customForms'] });
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
    },
  };
};
