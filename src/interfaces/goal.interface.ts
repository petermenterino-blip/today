export interface Goal {
  id: string;
  studentId: string;
  title: string;
  description: string;
  progressPercentage: number;
  milestones: Milestone[];
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
  blockers?: string;
  notes?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}
