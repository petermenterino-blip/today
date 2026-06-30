export interface Session {
  id: string;
  mentorId: string;
  studentId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string; // Google Meet link
  recordingUrl?: string;
  attendanceStatus: 'attended' | 'missed' | 'late' | 'pending';
  notes?: string; // Mentor session notes
  createdAt: string;
  updatedAt: string;
  programId?: string;
  duration?: string;
  timezone?: string;
  meetingType?: 'Google Meet' | 'Zoom' | 'Offline';
  sessionType?: string;
  recurringSession?: boolean;
  reminderTime?: string;
  attachedFiles?: string;
  status?: 'scheduled' | 'cancelled' | 'completed';
  internalNotes?: string;
}
