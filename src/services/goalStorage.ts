import { supabase } from '../lib/supabase';
import { Goal } from '../interfaces';
import { notify } from './notificationService';

function rowToGoal(row: any, milestones?: any[]): Goal {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    description: row.description || '',
    progressPercentage: row.progress_percentage ?? 0,
    status: row.status,
    blockers: row.blockers,
    notes: row.notes,
    targetDate: row.target_date,
    milestones: (milestones || []).map((m: any) => ({ id: m.id, title: m.title, completed: m.completed })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function goalToRow(goal: Partial<Goal>): Record<string, any> {
  const row: Record<string, any> = {};
  if (goal.studentId !== undefined) row.student_id = goal.studentId;
  if (goal.title !== undefined) row.title = goal.title;
  if (goal.description !== undefined) row.description = goal.description;
  if (goal.progressPercentage !== undefined) row.progress_percentage = goal.progressPercentage;
  if (goal.status !== undefined) row.status = goal.status;
  if (goal.blockers !== undefined) row.blockers = goal.blockers;
  if (goal.notes !== undefined) row.notes = goal.notes;
  if (goal.targetDate !== undefined) row.target_date = goal.targetDate;
  return row;
}

export const goalStorage = {
  async getAll(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_milestones(*)')
      .order('created_at', { ascending: false });
    if (error) { console.error('goalStorage.getAll error:', error); return []; }
    return (data || []).map((row: any) => rowToGoal(row, row.goal_milestones));
  },

  async getByStudentId(studentId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_milestones(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) { console.error('goalStorage.getByStudentId error:', error); return []; }
    return (data || []).map((row: any) => rowToGoal(row, row.goal_milestones));
  },

  async getById(id: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_milestones(*)')
      .eq('id', id)
      .single();
    if (error) { console.error('goalStorage.getById error:', error); return null; }
    return rowToGoal(data, data?.goal_milestones);
  },

  async create(data: Partial<Goal>): Promise<Goal> {
    const row = goalToRow(data);
    const { data: created } = await supabase
      .from('goals')
      .insert(row)
      .select()
      .single();
    const goal = created ? rowToGoal(created) : (await this.getById(data.id || ''))!;
    if (data.milestones && data.milestones.length > 0) {
      const milestoneRows = data.milestones.map((m: any) => ({
        goal_id: goal.id,
        title: m.title,
        completed: m.completed || false,
      }));
      const { data: createdMilestones } = await supabase
        .from('goal_milestones')
        .insert(milestoneRows)
        .select();
      goal.milestones = (createdMilestones || []).map((m: any) => ({
        id: m.id, title: m.title, completed: m.completed,
      }));
    }
    return goal;
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    const row = goalToRow(updates);
    if (Object.keys(row).length > 0) {
      row.updated_at = new Date().toISOString();
      await supabase.from('goals').update(row).eq('id', id);
    }
    if (updates.milestones) {
      await supabase.from('goal_milestones').delete().eq('goal_id', id);
      if (updates.milestones.length > 0) {
        const milestoneRows = updates.milestones.map((m: any) => ({
          goal_id: id, title: m.title, completed: m.completed || false,
        }));
        await supabase.from('goal_milestones').insert(milestoneRows);
      }
    }
    if (updates.status === 'completed') {
      const current = await supabase.from('goals').select('title, student_id').eq('id', id).single();
      if (current.data) {
        notify.goalCompleted(current.data.student_id, '', current.data.title).catch(() => {});
      }
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    return !error;
  },

  async seed(items: Goal[]): Promise<void> {
    for (const item of items) {
      await this.create(item);
    }
  },
};