import { supabase } from '../lib/supabase';
import { ServiceResponse, TaskActivity } from '../types';

function rowToTaskActivity(row: any): TaskActivity {
  return {
    id: row.id,
    user_id: row.student_id,
    user_name: '', // resolved below
    status: row.status,
    mentor_response: row.mentor_response || '',
    created_at: row.created_at,
    task_title: row.title,
    description: row.description || '',
    due_date: row.due_date || '',
    priority: row.priority || 'medium',
    file_url: row.file_url || '',
    feedback: row.feedback || '',
  };
}

export const taskService = {
  async fetchAll(): Promise<ServiceResponse<TaskActivity[]>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, student:profiles!tasks_student_id_fkey(name)')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    const activities = (data || []).map((row: any) => {
      const t = rowToTaskActivity(row);
      t.user_name = row.student?.name || '';
      return t;
    });
    return { data: activities, error: null };
  },

  async fetchByUserId(userId: string): Promise<ServiceResponse<TaskActivity[]>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, student:profiles!tasks_student_id_fkey(name)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    const activities = (data || []).map((row: any) => {
      const t = rowToTaskActivity(row);
      t.user_name = row.student?.name || '';
      return t;
    });
    return { data: activities, error: null };
  },

  async insert(activity: Omit<TaskActivity, 'id' | 'created_at'>): Promise<ServiceResponse<TaskActivity>> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        student_id: activity.user_id,
        mentor_id: activity.user_id,
        title: activity.task_title || 'Untitled Task',
        description: activity.description,
        due_date: activity.due_date,
        priority: activity.priority || 'medium',
        status: activity.status || 'pending',
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: rowToTaskActivity(data), error: null };
  },

  async updateStatus(id: string, status: TaskActivity['status'], response?: string): Promise<ServiceResponse<void>> {
    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (response !== undefined) {
      updates.mentor_response = response;
      updates.feedback = response;
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) return { data: undefined, error: error.message };
    return { data: undefined, error: null };
  },

  async update(id: string, updates: Partial<TaskActivity>): Promise<ServiceResponse<void>> {
    const row: Record<string, any> = {};
    if (updates.task_title !== undefined) row.title = updates.task_title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.due_date !== undefined) row.due_date = updates.due_date;
    if (updates.priority !== undefined) row.priority = updates.priority;
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.feedback !== undefined) row.feedback = updates.feedback;
    if (updates.mentor_response !== undefined) row.mentor_response = updates.mentor_response;
    row.updated_at = new Date().toISOString();
    const { error } = await supabase.from('tasks').update(row).eq('id', id);
    if (error) return { data: undefined, error: error.message };
    return { data: undefined, error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return { data: undefined, error: error.message };
    return { data: undefined, error: null };
  },
};