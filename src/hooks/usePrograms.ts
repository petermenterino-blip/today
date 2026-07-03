import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Program } from '../types';
import { programService, ProgramEnrollment } from '../services/programService';
import { useRealtimeData } from './useRealtimeData';

export const usePrograms = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'programs', queryKey: ['programs'] }]);

  const { data: programs = [], isLoading: loading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await programService.fetchAll();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addProgram = useMutation({
    mutationFn: (program: Omit<Program, 'id' | 'progress' | 'status'>) => programService.insert(program),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const deleteProgram = useMutation({
    mutationFn: (id: string) => programService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, program }: { id: string, program: Partial<Program> }) => programService.update(id, program),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const duplicateProgram = useMutation({
    mutationFn: (id: string) => programService.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const archiveProgram = useMutation({
    mutationFn: (id: string) => programService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const unarchiveProgram = useMutation({
    mutationFn: (id: string) => programService.unarchive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] })
  });

  const useEnrollments = (programId: string) => {
    const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
      queryKey: ['program-enrollments', programId],
      queryFn: async () => {
        const { data } = await programService.fetchEnrollments(programId);
        return data || [];
      },
      staleTime: 60 * 1000,
    });
    return { enrollments, enrollmentsLoading };
  };

  const enrollStudent = useMutation({
    mutationFn: ({ programId, studentId }: { programId: string, studentId: string }) =>
      programService.enrollStudent(programId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program-enrollments', variables.programId] });
    }
  });

  const unenrollStudent = useMutation({
    mutationFn: ({ programId, studentId }: { programId: string, studentId: string }) =>
      programService.unenrollStudent(programId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program-enrollments', variables.programId] });
    }
  });

  const updateEnrollmentStatus = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string, status: 'active' | 'completed' | 'dropped' }) =>
      programService.updateEnrollmentStatus(enrollmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-enrollments'] });
    }
  });

  return {
    programs,
    loading,
    addProgram: addProgram.mutateAsync,
    deleteProgram: deleteProgram.mutateAsync,
    updateProgram: updateProgram.mutateAsync,
    duplicateProgram: duplicateProgram.mutateAsync,
    archiveProgram: archiveProgram.mutateAsync,
    unarchiveProgram: unarchiveProgram.mutateAsync,
    useEnrollments,
    enrollStudent: enrollStudent.mutateAsync,
    unenrollStudent: unenrollStudent.mutateAsync,
    updateEnrollmentStatus: updateEnrollmentStatus.mutateAsync,
  };
};
