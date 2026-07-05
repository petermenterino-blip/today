import { supabase } from '../lib/supabase';
import { JournalEntry } from '../interfaces';
import { notify } from './notificationService';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';

function rowToJournal(row: any): JournalEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    type: row.type,
    title: row.title || '',
    content: row.content,
    mood: row.mood,
    wins: row.wins || [],
    challenges: row.challenges || [],
    mentorComments: row.mentor_comments || [],
    reviewedByMentor: row.reviewed_by_mentor || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function journalToRow(entry: Partial<JournalEntry>): Record<string, any> {
  const row: Record<string, any> = {};
  if (entry.studentId !== undefined) row.student_id = entry.studentId;
  if (entry.type !== undefined) row.type = entry.type;
  if (entry.title !== undefined) row.title = entry.title;
  if (entry.content !== undefined) row.content = entry.content;
  if (entry.mood !== undefined) row.mood = entry.mood;
  if (entry.wins !== undefined) row.wins = entry.wins;
  if (entry.challenges !== undefined) row.challenges = entry.challenges;
  if (entry.mentorComments !== undefined) row.mentor_comments = entry.mentorComments;
  if (entry.reviewedByMentor !== undefined) row.reviewed_by_mentor = entry.reviewedByMentor;
  return row;
}

export const journalStorage = {
  async getAll(): Promise<JournalEntry[]> {
    const result = await safeQuery(
      'journalStorage.getAll',
      () => supabase.from('journals').select('id,student_id,type,title,content,mood,wins,challenges,mentor_comments,reviewed_by_mentor,created_at,updated_at').order('created_at', { ascending: false }).limit(50),
      [],
      'journals',
    );
    if (result.error) console.warn('journalStorage.getAll:', interpretError(result.error));
    return (result.data || []).map(rowToJournal);
  },

  async getByStudentId(studentId: string): Promise<JournalEntry[]> {
    const result = await safeQuery(
      'journalStorage.getByStudentId',
      () => supabase.from('journals').select('id,student_id,type,title,content,mood,wins,challenges,mentor_comments,reviewed_by_mentor,created_at,updated_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(50),
      [],
      `journals:${studentId}`,
    );
    if (result.error) console.warn('journalStorage.getByStudentId:', interpretError(result.error));
    return (result.data || []).map(rowToJournal);
  },

  async getById(id: string): Promise<JournalEntry | null> {
    const result = await safeQuery(
      'journalStorage.getById',
      () => supabase.from('journals').select('id,student_id,type,title,content,mood,wins,challenges,mentor_comments,reviewed_by_mentor,created_at,updated_at').eq('id', id).single(),
      null,
    );
    if (result.error || !result.data) return null;
    return rowToJournal(result.data);
  },

  async create(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const row = journalToRow(data as any);
    const result = await safeMutate<JournalEntry>(
      'journalStorage.create',
      () => supabase.from('journals').insert(row).select().single(),
      'journals',
    );
    if (result.error) throw new Error(interpretError(result.error));
    const journal = rowToJournal(result.data);
    if (journal.studentId) {
      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .select('program:program_id(mentor_id)')
        .eq('student_id', journal.studentId)
        .maybeSingle();
      const mentorId: string = (enrollment as any)?.program?.mentor_id || '';
      notify.journalSubmitted(journal.studentId, mentorId).catch(() => {});
    }
    return journal;
  },

  async update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    const row = journalToRow(updates);
    if (Object.keys(row).length > 0) {
      row.updated_at = new Date().toISOString();
      const result = await safeMutate(
        'journalStorage.update',
        () => supabase.from('journals').update(row).eq('id', id),
        'journals',
      );
      if (result.error) {
        console.warn('journalStorage.update:', interpretError(result.error));
        return null;
      }
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const result = await safeMutate(
      'journalStorage.delete',
      () => supabase.from('journals').delete().eq('id', id),
      'journals',
    );
    if (result.error) {
      console.warn('journalStorage.delete:', interpretError(result.error));
    }
    return !result.error;
  },

  async seed(items: JournalEntry[]): Promise<void> {
    for (const item of items) {
      try { await this.create(item); } catch {}
    }
  },
};