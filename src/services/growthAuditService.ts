import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

export interface GrowthAuditMetrics {
  totalTasks: number;
  completedTasks: number;
  feedbackGiven: number;
  completionRate: number;
}

export const growthAuditService = {
  async updateGrowthScore(userId: string, score: number): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('students')
      .update({ growth_score: score })
      .eq('id', userId);

    if (error) return handleError(error);
    return { data: null, error: null };
  },

  calculateMetrics(userId: string, taskActivities: { user_id: string; status?: string; mentor_feedback?: any }[]): GrowthAuditMetrics {
    const studentTasks = taskActivities.filter(t => t.user_id === userId);
    const completed = studentTasks.filter(t => t.status === 'completed');
    const tasksWithFeedback = studentTasks.filter(t => t.mentor_feedback);
    return {
      totalTasks: studentTasks.length,
      completedTasks: completed.length,
      feedbackGiven: tasksWithFeedback.length,
      completionRate: studentTasks.length > 0 ? Math.round((completed.length / studentTasks.length) * 100) : 0,
    };
  },
};
