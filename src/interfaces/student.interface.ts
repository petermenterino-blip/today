export interface StudentProfile {
  id: string; // user ID
  user_id?: string;
  name: string;
  email: string;
  status: 'applied' | 'active' | 'at_risk' | 'completed' | 'alumni';
  healthStatus: 'active' | 'needs_attention' | 'at_risk';
  tags: string[]; // e.g., High Potential, Needs Support, Leadership
  lastLogin?: string;
  privateNotes?: string; // Mentor private notes
  notes?: string; // General notes
  growth_score?: number;
  mentor_id?: string;
  specialization?: string;
  current_status?: string;
  metrics: {
    attendanceRate: number;
    goalCompletionRate: number;
    activityLevel: number;
  }
}

export interface StudentTimelineEvent {
  id: string;
  studentId: string;
  type: 'application_submitted' | 'session_attended' | 'goal_completed' | 'task_submitted' | 'milestone_achieved';
  title: string;
  description?: string;
  timestamp: string;
}
