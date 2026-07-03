import { supabase } from '../lib/supabase';
import { Session } from '../interfaces/session.interface';
import { ServiceResponse } from '../types';
import { notify } from './notificationService';
import { handleError } from '../lib/serviceHelper';

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
      .select('*')
      .order('start_time', { ascending: true });
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToSession), error: null };
  },

  async insert(session: Omit<Session, 'id'>): Promise<ServiceResponse<Session>> {
    const row = sessionToRow(session);
    const { data, error } = await supabase
      .from('sessions')
      .insert(row)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    const created = rowToSession(data);
    notify.sessionScheduled(created.studentId, created.mentorId, created.title, created.startTime).catch(() => {});
    return { data: created, error: null };
  },

  async update(id: string, session: Partial<Session>): Promise<ServiceResponse<Session>> {
    const row = sessionToRow(session);
    const { data, error } = await supabase
      .from('sessions')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Session not found' };
    return { data: rowToSession(data), error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  }
};