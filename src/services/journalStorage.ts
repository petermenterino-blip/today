import { supabase } from '../lib/supabase';
import { JournalEntry } from '../interfaces';
import { notify } from './notificationService';

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
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('journalStorage.getAll error:', error); return []; }
    return (data || []).map(rowToJournal);
  },

  async getByStudentId(studentId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) { console.error('journalStorage.getByStudentId error:', error); return []; }
    return (data || []).map(rowToJournal);
  },

  async getById(id: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { return null; }
    return rowToJournal(data);
  },

  async create(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const row = journalToRow(data as any);
    const { data: created, error } = await supabase
      .from('journals')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    const journal = rowToJournal(created);
    if (journal.studentId) {
      notify.journalSubmitted(journal.studentId, '').catch(() => {});
    }
    return journal;
  },

  async update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    const row = journalToRow(updates);
    if (Object.keys(row).length > 0) {
      row.updated_at = new Date().toISOString();
      await supabase.from('journals').update(row).eq('id', id);
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('journals').delete().eq('id', id);
    return !error;
  },

  async seed(items: JournalEntry[]): Promise<void> {
    for (const item of items) {
      await this.create(item);
    }
  },
};