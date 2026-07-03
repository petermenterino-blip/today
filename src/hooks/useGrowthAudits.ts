import { useMutation, useQueryClient } from '@tanstack/react-query';
import { growthAuditService, GrowthAuditMetrics } from '../services/growthAuditService';
import type { TaskActivity } from '../types';

export const useGrowthAudits = (taskActivities: TaskActivity[]) => {
  const queryClient = useQueryClient();

  const updateGrowthScoreMutation = useMutation({
    mutationFn: ({ userId, score }: { userId: string; score: number }) =>
      growthAuditService.updateGrowthScore(userId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const getStudentMetrics = (userId: string): GrowthAuditMetrics =>
    growthAuditService.calculateMetrics(userId, taskActivities);

  return {
    getStudentMetrics,
    updateGrowthScore: (userId: string, score: number) =>
      updateGrowthScoreMutation.mutateAsync({ userId, score }),
    isSaving: updateGrowthScoreMutation.isPending,
  };
};
