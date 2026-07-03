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
}

function fromDb(row: any): TimelineEvent {
  return {
    id: row.id,
    student_id: row.student_id,
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp,
  };
}

export const timelineService = {
  async getByStudentId(studentId: string): Promise<TimelineEvent[]> {
    const result = await safeQuery(
      'timelineService.getByStudentId',
      () => supabase
        .from('student_timeline_events')
        .select('*')
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
        })
        .select()
        .single(),
    );
    if (result.error || !result.data) return null;
    return fromDb(result.data);
  },

  async autoLogGoalCreated(studentId: string, title: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'goal_completed',
      title: 'Goal Created',
      description: `New goal created: "${title}"`,
    }).catch(() => {});
  },

  async autoLogGoalCompleted(studentId: string, title: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'goal_completed',
      title: 'Goal Completed',
      description: `Goal achieved: "${title}"`,
    }).catch(() => {});
  },

  async autoLogTaskAssigned(studentId: string, title: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'task_submitted',
      title: 'Task Assigned',
      description: `New task assigned: "${title}"`,
    }).catch(() => {});
  },

  async autoLogTaskCompleted(studentId: string, title: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'task_submitted',
      title: 'Task Completed',
      description: `Task completed: "${title}"`,
    }).catch(() => {});
  },

  async autoLogSessionCompleted(studentId: string, title: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'session_attended',
      title: 'Session Completed',
      description: `Session completed: "${title}"`,
    }).catch(() => {});
  },

  async autoLogFormSubmitted(studentId: string, formTitle: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'milestone_achieved',
      title: 'Form Submitted',
      description: `Form submitted: "${formTitle}"`,
    }).catch(() => {});
  },

  async autoLogApplicationSubmitted(studentId: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'application_submitted',
      title: 'Application Submitted',
      description: 'Application has been submitted for review.',
    }).catch(() => {});
  },

  async autoLogApplicationApproved(studentId: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'application_submitted',
      title: 'Application Approved',
      description: 'Application has been accepted.',
    }).catch(() => {});
  },

  async autoLogFileShared(studentId: string, fileName: string): Promise<void> {
    await this.create({
      student_id: studentId,
      type: 'milestone_achieved',
      title: 'File Shared',
      description: `File shared: "${fileName}"`,
    }).catch(() => {});
  },

  async addMentorNote(studentId: string, note: string): Promise<TimelineEvent | null> {
    return this.create({
      student_id: studentId,
      type: 'milestone_achieved',
      title: 'Mentor Note',
      description: note,
    });
  },
};
