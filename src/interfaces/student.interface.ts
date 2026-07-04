export interface StudentProfile {
  id: string;
  user_id?: string;
  name: string;
  full_name?: string;
  email: string;
  user_email?: string;
  status: 'applied' | 'active' | 'at_risk' | 'completed' | 'alumni';
  healthStatus: 'active' | 'needs_attention' | 'at_risk';
  tags: string[];
  lastLogin?: string;
  privateNotes?: string;
  notes?: string;
  growth_score?: number;
  mentor_id?: string;
  specialization?: string;
  current_status?: string;
  metrics: {
    attendanceRate: number;
    goalCompletionRate: number;
    activityLevel: number;
  };
  avatar_url?: string;
  phone?: string;
  bio?: string;
  linkedin_url?: string;
  resume_link?: string;
  goal_progress?: number;
  application_status?: string;
  created_at?: string;
  updated_at?: string;
  timezone?: string;
  location?: string;
  skills?: string[];
  portfolio_url?: string;
  github_url?: string;
  program_id?: string;
  batch?: string;
  cohort?: string;
  invited_at?: string;
  first_login_at?: string;
  onboarding_completed?: boolean;
  preferred_meeting_time?: string;
  learning_objectives?: string[];
  focus_area?: string;
  social_links?: Record<string, string>;
}

export interface StudentTimelineEvent {
  id: string;
  studentId: string;
  type: 'application_submitted' | 'session_attended' | 'goal_completed' | 'task_submitted' | 'milestone_achieved';
  title: string;
  description?: string;
  timestamp: string;
}
