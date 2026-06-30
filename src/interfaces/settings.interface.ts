export interface MentorSettings {
  id: string;
  mentorId: string;
  timezone: string;
  sessionDuration: number; // in minutes
  bufferTime: number; // in minutes
  notificationsEnabled: boolean;
  defaultMeetingUrl?: string;
  workingDays: number[]; // 0-6 (0 = Sunday)
  availableHoursStart: string; // HH:mm
  availableHoursEnd: string; // HH:mm
}

export interface DashboardLayout {
  id: string;
  userId: string;
  layout: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'active_students' | 'upcoming_sessions' | 'pending_reviews' | 'goal_progress' | 'activity_feed' | 'growth_analytics';
  x: number;
  y: number;
  w: number;
  h: number;
}
