import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { customFormService } from '../services/customFormService';
import { useRealtimeData } from './useRealtimeData';
import type { CustomForm, FormSubmission } from '../types';
import type { FormAssignment } from '../services/customFormService';

export const useCustomForms = (userId?: string, mentorId?: string) => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'custom_forms', queryKey: ['customForms'] },
    { table: 'form_submissions', queryKey: ['formSubmissions'] },
    { table: 'form_assignments', queryKey: ['formAssignments'] },
  ]);

  const { data: forms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['customForms'],
    queryFn: () => customFormService.getAllForms(),
    staleTime: STALE_TIMES.slow,
  });

  const { data: allSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => customFormService.getAllSubmissions(),
    staleTime: STALE_TIMES.slow,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['formAssignments', userId],
    queryFn: () => userId ? customFormService.getAssignmentsByStudentId(userId) : Promise.resolve([]),
    enabled: !!userId,
    staleTime: STALE_TIMES.slow,
  });

  const { data: mentorAssignments = [] } = useQuery({
    queryKey: ['formAssignments', 'mentor', mentorId],
    queryFn: () => mentorId ? customFormService.getAssignmentsByMentorId(mentorId) : Promise.resolve([]),
    enabled: !!mentorId,
    staleTime: STALE_TIMES.slow,
  });

  const submissions = allSubmissions.filter(s => !userId || s.user_id === userId);

  const submitFormMutation = useMutation({
    mutationFn: (submission: Omit<FormSubmission, 'id' | 'submitted_at'>) =>
      customFormService.submitForm(submission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['formAssignments'] });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (data: { form_id: string; user_id: string; user_name: string; responses: Record<string, any> }) =>
      customFormService.saveDraft(data),
  });

  const assignedForms = assignments
    .filter(a => a.form)
    .map(a => ({ ...a.form!, assignment: a }));

  return {
    forms,
    formsLoading,
    submissions,
    submissionsLoading,
    assignments,
    assignmentsLoading,
    assignedForms,
    mentorAssignments,
    submitForm: (submission: Omit<FormSubmission, 'id' | 'submitted_at'>) => submitFormMutation.mutateAsync(submission),
    saveDraft: (data: { form_id: string; user_id: string; user_name: string; responses: Record<string, any> }) =>
      saveDraftMutation.mutateAsync(data),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['customForms'] });
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['formAssignments'] });
    },
  };
};
