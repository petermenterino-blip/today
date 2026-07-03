import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import { StudentProfile } from '../types';

export const useStudentList = () => {
  const queryClient = useQueryClient();

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    students,
    loading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  };
};
