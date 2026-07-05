import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { studentService } from '../services/studentService';
import { StudentProfile } from '../types';
import { useRealtimeData } from './useRealtimeData';

export const useStudentList = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'student_profiles', queryKey: ['students'] }]);

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getAll(),
    staleTime: STALE_TIMES.slow,
  });

  return {
    students,
    loading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  };
};
