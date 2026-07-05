import { supabase } from '../lib/supabase';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';

export interface TimelineEvent {
  id: string;
  student_id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  mentor_id?: string;
  category?: string;
  metadata?: Record<string, any>;
}

function fromDb(row: any): TimelineEvent {
  return {
    id: row.id,
    student_id: row.student_id,
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp || row.created_at,
    mentor_id: row.mentor_id,
    category: row.category,
    metadata: row.metadata || {},
  };
}

export const timelineService = {
  async getByStudentId(studentId: string): Promise<TimelineEvent[]> {
    const result = await safeQuery(
      'timelineService.getByStudentId',
      () => supabase
        .from('student_timeline_events')
        .select('id,student_id,type,title,description,timestamp,mentor_id,category,metadata')
        .eq('student_id', studentId)
        .order('timestamp', { ascending: false }),
      [],
    );
    if (result.error) console.warn('timelineService.getByStudentId:', interpretError(result.error));
    return (result.data || []).map(fromDb);
  },

  async create(event: {
    student_id: string;
    type: string;
    title: string;
    description?: string;
    mentor_id?: string;
    category?: string;
    metadata?: Record<string, any>;
  }): Promise<TimelineEvent | null> {
    const result = await safeMutate(
      'timelineService.create',
      () => supabase
        .from('student_timeline_events')
        .insert({
          student_id: event.student_id,
          type: event.type,
          title: event.title,
          description: event.description || null,
          mentor_id: event.mentor_id || null,
          category: event.category || null,
          metadata: event.metadata || {},
        })
        .select()
        .single(),
    );
    if (result.error || !result.data) return null;
    return fromDb(result.data);
  },

  async autoLogGoalCreated(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'goal_created', title: 'Goal Created',
      description: `New goal created: "${title}"`, mentor_id: mentorId, category: 'goals',
    }).catch(() => {});
  },

  async autoLogGoalUpdated(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'goal_updated', title: 'Goal Updated',
      description: `Goal updated: "${title}"`, mentor_id: mentorId, category: 'goals',
    }).catch(() => {});
  },

  async autoLogGoalCompleted(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'goal_completed', title: 'Goal Completed',
      description: `Goal achieved: "${title}"`, mentor_id: mentorId, category: 'goals',
    }).catch(() => {});
  },

  async autoLogTaskAssigned(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'task_assigned', title: 'Task Assigned',
      description: `New task assigned: "${title}"`, mentor_id: mentorId, category: 'tasks',
    }).catch(() => {});
  },

  async autoLogTaskCompleted(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'task_completed', title: 'Task Completed',
      description: `Task completed: "${title}"`, mentor_id: mentorId, category: 'tasks',
    }).catch(() => {});
  },

  async autoLogTaskUpdated(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'task_updated', title: 'Task Updated',
      description: `Task updated: "${title}"`, mentor_id: mentorId, category: 'tasks',
    }).catch(() => {});
  },

  async autoLogSessionScheduled(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'session_scheduled', title: 'Session Scheduled',
      description: `Session scheduled: "${title}"`, mentor_id: mentorId, category: 'sessions',
    }).catch(() => {});
  },

  async autoLogSessionCompleted(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'session_completed', title: 'Session Completed',
      description: `Session completed: "${title}"`, mentor_id: mentorId, category: 'sessions',
    }).catch(() => {});
  },

  async autoLogSessionRescheduled(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'session_rescheduled', title: 'Session Rescheduled',
      description: `Session rescheduled: "${title}"`, mentor_id: mentorId, category: 'sessions',
    }).catch(() => {});
  },

  async autoLogSessionCancelled(studentId: string, title: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'session_cancelled', title: 'Session Cancelled',
      description: `Session cancelled: "${title}"`, mentor_id: mentorId, category: 'sessions',
    }).catch(() => {});
  },

  async autoLogFormSent(studentId: string, formTitle: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'form_sent', title: 'Form Sent',
      description: `Form assigned: "${formTitle}"`, mentor_id: mentorId, category: 'forms',
    }).catch(() => {});
  },

  async autoLogFormSubmitted(studentId: string, formTitle: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'form_submitted', title: 'Form Submitted',
      description: `Form submitted: "${formTitle}"`, category: 'forms',
    }).catch(() => {});
  },

  async autoLogFileShared(studentId: string, fileName: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'file_shared', title: 'File Shared',
      description: `File shared: "${fileName}"`, mentor_id: mentorId, category: 'resources',
    }).catch(() => {});
  },

  async autoLogCredentialIssued(studentId: string, credentialTitle: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'credential_issued', title: 'Credential Issued',
      description: `Credential issued: "${credentialTitle}"`, mentor_id: mentorId, category: 'credentials',
    }).catch(() => {});
  },

  async autoLogCredentialRevoked(studentId: string, credentialTitle: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'credential_revoked', title: 'Credential Revoked',
      description: `Credential revoked: "${credentialTitle}"`, mentor_id: mentorId, category: 'credentials',
    }).catch(() => {});
  },

  async autoLogApplicationSubmitted(studentId: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'application_submitted', title: 'Application Submitted',
      description: 'Application has been submitted for review.', mentor_id: mentorId, category: 'applications',
    }).catch(() => {});
  },

  async autoLogApplicationApproved(studentId: string, mentorId?: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'application_approved', title: 'Application Approved',
      description: 'Application has been accepted.', mentor_id: mentorId, category: 'applications',
    }).catch(() => {});
  },

  async autoLogin(studentId: string): Promise<void> {
    await this.create({
      student_id: studentId, type: 'student_login', title: 'Student Login',
      description: 'Student logged into their account.', category: 'activity',
    }).catch(() => {});
  },

  async addMentorNote(studentId: string, note: string, mentorId?: string): Promise<TimelineEvent | null> {
    return this.create({
      student_id: studentId, type: 'mentor_note_added', title: 'Mentor Note Added',
      description: note, mentor_id: mentorId, category: 'notes',
    });
  },
};
