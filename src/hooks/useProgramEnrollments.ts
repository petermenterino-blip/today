import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { programEnrollmentService } from '../services/programEnrollmentService';
import { useRealtimeData } from './useRealtimeData';

export const useProgramEnrollments = (programId?: string) => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'program_enrollments', queryKey: ['program-enrollments'] }]);

  const { data: enrollments = [], isLoading: loading } = useQuery({
    queryKey: ['program-enrollments', programId],
    queryFn: async () => {
      if (programId) {
        const { data } = await programEnrollmentService.fetchByProgram(programId);
        return data || [];
      }
      const { data } = await programEnrollmentService.fetchAll();
      return data || [];
    },
    staleTime: STALE_TIMES.normal,
  });

  const assignProgram = useMutation({
    mutationFn: ({ programId: pid, studentId, options }: {
      programId: string;
      studentId: string;
      options?: {
        startDate?: string;
        targetCompletionDate?: string;
        enrollmentStatus?: string;
        mentorNotes?: string;
      };
    }) => programEnrollmentService.assign(pid, studentId, options),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-enrollments'] })
  });

  const assignMultiple = useMutation({
    mutationFn: ({ programIds, studentId, options }: {
      programIds: string[];
      studentId: string;
      options?: {
        startDate?: string;
        targetCompletionDate?: string;
        enrollmentStatus?: string;
        mentorNotes?: string;
      };
    }) => programEnrollmentService.assignMultiple(programIds, studentId, options),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-enrollments'] })
  });

  const updateEnrollment = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      programEnrollmentService.update(id, updates as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-enrollments'] })
  });

  const removeEnrollment = useMutation({
    mutationFn: (id: string) => programEnrollmentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-enrollments'] })
  });

  return {
    enrollments,
    loading,
    assignProgram: assignProgram.mutateAsync,
    assignMultiple: assignMultiple.mutateAsync,
    updateEnrollment: updateEnrollment.mutateAsync,
    removeEnrollment: removeEnrollment.mutateAsync,
  };
};

export const useStudentEnrollments = (studentId: string | undefined) => {
  const { data: enrollments = [], isLoading: loading } = useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await programEnrollmentService.fetchByStudent(studentId);
      return data || [];
    },
    enabled: !!studentId,
    staleTime: STALE_TIMES.normal,
  });

  return { enrollments, loading };
};
