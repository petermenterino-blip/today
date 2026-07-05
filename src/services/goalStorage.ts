import { supabase } from '../lib/supabase';
import { Goal } from '../interfaces';
import { notify } from './notificationService';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';

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
    const result = await safeQuery(
      'goalStorage.getAll',
      () => supabase.from('goals').select('id,student_id,title,description,status,progress_percentage,target_date,created_at,updated_at,blockers,notes,goal_milestones(id,title,completed)').order('created_at', { ascending: false }).limit(50),
      [],
      'goals',
    );
    if (result.error) console.warn('goalStorage.getAll:', interpretError(result.error));
    return (result.data || []).map((row: any) => rowToGoal(row, row.goal_milestones));
  },

  async getByStudentId(studentId: string): Promise<Goal[]> {
    const result = await safeQuery(
      'goalStorage.getByStudentId',
      () => supabase.from('goals').select('id,student_id,title,description,status,progress_percentage,target_date,created_at,updated_at,blockers,notes,goal_milestones(id,title,completed)').eq('student_id', studentId).order('created_at', { ascending: false }).limit(50),
      [],
      `goals:${studentId}`,
    );
    if (result.error) console.warn('goalStorage.getByStudentId:', interpretError(result.error));
    return (result.data || []).map((row: any) => rowToGoal(row, row.goal_milestones));
  },

  async getById(id: string): Promise<Goal | null> {
    const result = await safeQuery(
      'goalStorage.getById',
      () => supabase.from('goals').select('id,student_id,title,description,status,progress_percentage,target_date,created_at,updated_at,blockers,notes,goal_milestones(id,title,completed)').eq('id', id).single(),
      null,
    );
    if (result.error || !result.data) return null;
    return rowToGoal(result.data, result.data?.goal_milestones);
  },

  async create(data: Partial<Goal>): Promise<Goal> {
    const row = goalToRow(data);
    const result = await safeMutate(
      'goalStorage.create',
      () => supabase.from('goals').insert(row).select().single(),
      'goals',
    );
    if (result.error || !result.data) throw new Error(interpretError(result.error));
    const goal = rowToGoal(result.data);
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
      const result = await safeMutate(
        'goalStorage.update',
        () => supabase.from('goals').update(row).eq('id', id),
        'goals',
      );
      if (result.error) {
        console.warn('goalStorage.update:', interpretError(result.error));
        return null;
      }
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
        const { data: enrollment } = await supabase
          .from('program_enrollments')
          .select('program:program_id(mentor_id)')
          .eq('student_id', current.data.student_id)
          .maybeSingle();
        const mentorId: string = (enrollment as any)?.program?.mentor_id || '';
        notify.goalCompleted(current.data.student_id, mentorId, current.data.title).catch(() => {});
      }
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const result = await safeMutate(
      'goalStorage.delete',
      () => supabase.from('goals').delete().eq('id', id),
      'goals',
    );
    if (result.error) console.warn('goalStorage.delete:', interpretError(result.error));
    return !result.error;
  },

  async seed(items: Goal[]): Promise<void> {
    for (const item of items) {
      try { await this.create(item); } catch {}
    }
  },
};