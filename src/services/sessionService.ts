import { supabase } from '../lib/supabase';
import { Session } from '../interfaces/session.interface';
import { ServiceResponse } from '../types';
import { notify } from './notificationService';
import { handleError } from '../lib/serviceHelper';
import { timelineService } from './timelineService';

const CAMEL_TO_SNAKE: Record<string, string> = {
  mentorId: 'mentor_id',
  studentId: 'student_id',
  startTime: 'start_time',
  endTime: 'end_time',
  meetingUrl: 'meeting_url',
  recordingUrl: 'recording_url',
  attendanceStatus: 'attendance_status',
  programId: 'program_id',
  meetingType: 'meeting_type',
  sessionType: 'session_type',
  recurringSession: 'recurring_session',
  reminderTime: 'reminder_time',
  attachedFiles: 'attached_files',
  internalNotes: 'internal_notes',
};

const SESSION_FIELDS = 'id,student_id,mentor_id,title,description,start_time,end_time,status,attendance_status,meeting_url,recording_url,program_id,meeting_type,session_type,created_at';

const SNAKE_TO_CAMEL: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([k, v]) => [v, k])
);

function rowToSession(row: any): Session {
  const s: any = { id: row.id };
  for (const [col, val] of Object.entries(row)) {
    if (col === 'id') continue;
    const key = SNAKE_TO_CAMEL[col] || col;
    s[key] = val;
  }
  return s as Session;
}

function sessionToRow(session: Partial<Session>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(session)) {
    if (key === 'id') continue;
    const col = CAMEL_TO_SNAKE[key] || key;
    row[col] = val;
  }
  return row;
}

export const sessionService = {
  async fetchAll(): Promise<ServiceResponse<Session[]>> {
    const { data, error } = await supabase
      .from('sessions')
      .select(SESSION_FIELDS)
      .order('start_time', { ascending: true });
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToSession), error: null };
  },

  async insert(session: Omit<Session, 'id'>): Promise<ServiceResponse<Session>> {
    const row = sessionToRow(session);

    // Conflict detection — prevent overlapping sessions for the same mentor
    if (session.mentorId && session.startTime && session.endTime) {
      const { data: conflicting } = await supabase
        .from('sessions')
        .select('id')
        .eq('mentor_id', session.mentorId)
        .neq('status', 'cancelled')
        .or(`start_time.lte.${session.endTime},end_time.gte.${session.startTime}`)
        .limit(1);
      if (conflicting && conflicting.length > 0) {
        return { data: null, error: 'This time slot conflicts with an existing session.' };
      }
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert(row)
      .select(SESSION_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    const created = rowToSession(data);
    notify.sessionScheduled(created.studentId, created.mentorId, created.title, created.startTime).catch((err) =>
      console.error('[sessionService] Failed to send session notification:', err)
    );
    timelineService.autoLogSessionScheduled(created.studentId, created.title, created.mentorId).catch((err) =>
      console.error('[sessionService] Failed to log session timeline:', err)
    );
    return { data: created, error: null };
  },

  async update(id: string, session: Partial<Session>): Promise<ServiceResponse<Session>> {
    const row = sessionToRow(session);
    const { data, error } = await supabase
      .from('sessions')
      .update(row)
      .eq('id', id)
      .select(SESSION_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Session not found' };

    const updated = rowToSession(data);
    if (session.startTime) {
      notify.sessionRescheduled(updated.studentId, updated.mentorId, updated.title, updated.startTime).catch((err) =>
        console.error('[sessionService] Failed to send reschedule notification:', err)
      );
      timelineService.autoLogSessionRescheduled(updated.studentId, updated.title, updated.mentorId).catch((err) =>
        console.error('[sessionService] Failed to log reschedule timeline:', err)
      );
    }
    return { data: updated, error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { data: old, error: fetchError } = await supabase
      .from('sessions')
      .select('student_id, mentor_id, title')
      .eq('id', id)
      .single();
    if (fetchError) return { data: undefined, error: handleError(fetchError).error };

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };

    if (old) {
      notify.sessionCancelled(old.student_id, old.mentor_id, old.title).catch((err) =>
        console.error('[sessionService] Failed to send cancellation notification:', err)
      );
      timelineService.autoLogSessionCancelled(old.student_id, old.title, old.mentor_id).catch((err) =>
        console.error('[sessionService] Failed to log cancellation timeline:', err)
      );
    }
    return { data: undefined, error: null };
  }
};