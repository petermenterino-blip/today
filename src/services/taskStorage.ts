import { supabase } from '../lib/supabase';
import { ActionItem } from '../interfaces';
import { notify } from './notificationService';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';

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

/** @deprecated Use taskService instead. Will be removed in a future version. */
export const taskStorage = {
  async getAll(): Promise<ActionItem[]> {
    const result = await safeQuery(
      'taskStorage.getAll',
      () => supabase.from('tasks').select('id,student_id,mentor_id,title,description,due_date,status,created_at,updated_at').order('created_at', { ascending: false }).limit(50),
      [],
      'tasks',
    );
    if (result.error) console.warn('taskStorage.getAll:', interpretError(result.error));
    return (result.data || []).map(rowToActionItem);
  },

  async getByStudentId(studentId: string): Promise<ActionItem[]> {
    const result = await safeQuery(
      'taskStorage.getByStudentId',
      () => supabase.from('tasks').select('id,student_id,mentor_id,title,description,due_date,status,created_at,updated_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(50),
      [],
      `tasks:${studentId}`,
    );
    if (result.error) console.warn('taskStorage.getByStudentId:', interpretError(result.error));
    return (result.data || []).map(rowToActionItem);
  },

  async getByMentorId(mentorId: string): Promise<ActionItem[]> {
    const result = await safeQuery(
      'taskStorage.getByMentorId',
      () => supabase.from('tasks').select('id,student_id,mentor_id,title,description,due_date,status,created_at,updated_at').eq('mentor_id', mentorId).order('created_at', { ascending: false }),
      [],
      `tasks:mentor:${mentorId}`,
    );
    if (result.error) console.warn('taskStorage.getByMentorId:', interpretError(result.error));
    return (result.data || []).map(rowToActionItem);
  },

  async getById(id: string): Promise<ActionItem | null> {
    const result = await safeQuery(
      'taskStorage.getById',
      () => supabase.from('tasks').select('id,student_id,mentor_id,title,description,due_date,status,created_at,updated_at').eq('id', id).single(),
      null,
    );
    if (result.error || !result.data) return null;
    return rowToActionItem(result.data);
  },

  async create(data: Partial<ActionItem>): Promise<ActionItem> {
    const row = actionItemToRow(data);
    const result = await safeMutate(
      'taskStorage.create',
      () => supabase.from('tasks').insert(row).select().single(),
      'tasks',
    );
    if (result.error || !result.data) throw new Error(interpretError(result.error));
    const task = rowToActionItem(result.data);
    notify.taskAssigned(task.studentId, task.mentorId, task.title).catch(() => {});
    return task;
  },

  async update(id: string, updates: Partial<ActionItem>): Promise<ActionItem | null> {
    const row = actionItemToRow(updates);
    if (Object.keys(row).length > 0) {
      row.updated_at = new Date().toISOString();
      const result = await safeMutate(
        'taskStorage.update',
        () => supabase.from('tasks').update(row).eq('id', id),
        'tasks',
      );
      if (result.error) {
        console.warn('taskStorage.update:', interpretError(result.error));
        return null;
      }
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
    const result = await safeMutate(
      'taskStorage.delete',
      () => supabase.from('tasks').delete().eq('id', id),
      'tasks',
    );
    if (result.error) console.warn('taskStorage.delete:', interpretError(result.error));
    return !result.error;
  },

  async seed(items: ActionItem[]): Promise<void> {
    for (const item of items) {
      try { await this.create(item); } catch {}
    }
  },
};