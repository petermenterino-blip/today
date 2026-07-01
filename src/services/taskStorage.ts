import { supabase } from '../lib/supabase';
import { ActionItem } from '../interfaces';
import { notify } from './notificationService';

function rowToActionItem(row: any): ActionItem {
  return {
    id: row.id,
    studentId: row.student_id,
    mentorId: row.mentor_id,
    title: row.title,
    description: row.description || '',
    dueDate: row.due_date || '',
    status: row.status || 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function actionItemToRow(item: Partial<ActionItem>): Record<string, any> {
  const row: Record<string, any> = {};
  if (item.studentId !== undefined) row.student_id = item.studentId;
  if (item.mentorId !== undefined) row.mentor_id = item.mentorId;
  if (item.title !== undefined) row.title = item.title;
  if (item.description !== undefined) row.description = item.description;
  if (item.dueDate !== undefined) row.due_date = item.dueDate;
  if (item.status !== undefined) row.status = item.status;
  return row;
}

export const taskStorage = {
  async getAll(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('taskStorage.getAll error:', error); return []; }
    return (data || []).map(rowToActionItem);
  },

  async getByStudentId(studentId: string): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) { console.error('taskStorage.getByStudentId error:', error); return []; }
    return (data || []).map(rowToActionItem);
  },

  async getByMentorId(mentorId: string): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });
    if (error) { console.error('taskStorage.getByMentorId error:', error); return []; }
    return (data || []).map(rowToActionItem);
  },

  async getById(id: string): Promise<ActionItem | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { return null; }
    return rowToActionItem(data);
  },

  async create(data: Partial<ActionItem>): Promise<ActionItem> {
    const row = actionItemToRow(data);
    const { data: created, error } = await supabase
      .from('tasks')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    const task = rowToActionItem(created);
    notify.taskAssigned(task.studentId, task.mentorId, task.title).catch(() => {});
    return task;
  },

  async update(id: string, updates: Partial<ActionItem>): Promise<ActionItem | null> {
    const row = actionItemToRow(updates);
    if (Object.keys(row).length > 0) {
      row.updated_at = new Date().toISOString();
      await supabase.from('tasks').update(row).eq('id', id);
    }
    if (updates.status === 'completed') {
      const current = await this.getById(id);
      if (current) {
        notify.taskCompleted(current.studentId, current.mentorId, current.title).catch(() => {});
      }
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    return !error;
  },

  async seed(items: ActionItem[]): Promise<void> {
    for (const item of items) {
      await this.create(item);
    }
  },
};