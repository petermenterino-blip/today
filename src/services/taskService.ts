import { supabase } from '../lib/supabase';
import { ServiceResponse, TaskActivity } from '../types';
import { handleError } from '../lib/serviceHelper';
import { notify } from './notificationService';
import { timelineService } from './timelineService';
import { edgeFunctionService } from './edgeFunctionService';

function rowToTaskActivity(row: any): TaskActivity {
  return {
    id: row.id,
    user_id: row.student_id,
    mentor_id: row.mentor_id || '',
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
    if (error) return { data: null, error: handleError(error).error };
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
    if (error) return { data: null, error: handleError(error).error };
    const activities = (data || []).map((row: any) => {
      const t = rowToTaskActivity(row);
      t.user_name = row.student?.name || '';
      return t;
    });
    return { data: activities, error: null };
  },

  async insert(activity: Omit<TaskActivity, 'id' | 'created_at'> & { mentor_id?: string }): Promise<ServiceResponse<TaskActivity>> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        student_id: activity.user_id,
        mentor_id: activity.mentor_id || '',
        title: activity.task_title || 'Untitled Task',
        description: activity.description,
        due_date: activity.due_date,
        priority: activity.priority || 'medium',
        status: activity.status || 'pending',
      })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    const created = rowToTaskActivity(data);

    // Notify student of new task
    notify.taskAssigned(created.user_id, created.mentor_id, created.task_title).catch((err) =>
      console.error('[taskService] Failed to send task assignment notification:', err)
    );
    // Timeline entry
    timelineService.autoLogTaskAssigned(created.user_id, created.task_title, created.mentor_id).catch((err) =>
      console.error('[taskService] Failed to log task timeline:', err)
    );
    // Email notification for task assignment
    (async () => {
      const { data: student } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', created.user_id)
        .single();
      if (student?.email) {
        edgeFunctionService.sendCustomEmail(
          student.email,
          'New Task Assigned',
          `<h2>New Task: ${created.task_title}</h2><p>You have been assigned a new task: <strong>${created.task_title}</strong>.</p><p>Due: ${created.due_date || 'No deadline'}</p><p>Log in to Mentorino to view and complete it.</p>`
        ).catch((err) => console.error('[taskService] Failed to send task assigned email:', err));
      }
    })();

    return { data: created, error: null };
  },

  async updateStatus(id: string, status: TaskActivity['status'], response?: string): Promise<ServiceResponse<void>> {
    const { data: current } = await supabase
      .from('tasks')
      .select('student_id, mentor_id, title')
      .eq('id', id)
      .single();

    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (response !== undefined) {
      updates.mentor_response = response;
      updates.feedback = response;
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };

    if (current && (status === 'completed' || status === 'submitted')) {
      notify.taskCompleted(current.student_id, current.mentor_id, current.title).catch((err) =>
        console.error('[taskService] Failed to send task completion notification:', err)
      );
      timelineService.autoLogTaskCompleted(current.student_id, current.title, current.mentor_id).catch((err) =>
        console.error('[taskService] Failed to log task completion timeline:', err)
      );
    }

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
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },
};