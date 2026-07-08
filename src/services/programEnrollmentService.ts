import { supabase } from '../lib/supabase';
import { ProgramEnrollment, ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

const ENROLLMENT_FIELDS = `
  id,program_id,student_id,status,enrollment_status,enrolled_at,
  start_date,target_completion_date,completed_at,
  mentor_notes,student_notes,
  current_module_id,completed_modules,remaining_modules,
  percentage_complete,last_activity
`;

function rowToEnrollment(row: any): ProgramEnrollment {
  return {
    id: row.id,
    program_id: row.program_id,
    student_id: row.student_id,
    status: row.status,
    enrollment_status: row.enrollment_status || 'Assigned',
    enrolled_at: row.enrolled_at,
    start_date: row.start_date,
    target_completion_date: row.target_completion_date,
    completed_at: row.completed_at,
    mentor_notes: row.mentor_notes,
    student_notes: row.student_notes,
    current_module_id: row.current_module_id,
    completed_modules: row.completed_modules || 0,
    remaining_modules: row.remaining_modules || 0,
    percentage_complete: row.percentage_complete || 0,
    last_activity: row.last_activity,
    student_name: row.profiles?.full_name || row.profiles?.name,
    student_email: row.profiles?.email,
    program_title: row.programs?.title,
  };
}

export const programEnrollmentService = {
  async fetchByProgram(programId: string): Promise<ServiceResponse<ProgramEnrollment[]>> {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select(`${ENROLLMENT_FIELDS}, profiles!inner(full_name,email), programs!inner(title)`)
      .eq('program_id', programId);
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEnrollment), error: null };
  },

  async fetchByStudent(studentId: string): Promise<ServiceResponse<ProgramEnrollment[]>> {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select(`${ENROLLMENT_FIELDS}, programs!inner(title,description,image,thumbnail,difficulty,duration,status,visibility)`)
      .eq('student_id', studentId);
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEnrollment), error: null };
  },

  async fetchAll(): Promise<ServiceResponse<ProgramEnrollment[]>> {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select(`${ENROLLMENT_FIELDS}, profiles!inner(full_name,email), programs!inner(title)`)
      .order('enrolled_at', { ascending: false });
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEnrollment), error: null };
  },

  async getById(id: string): Promise<ServiceResponse<ProgramEnrollment>> {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select(`${ENROLLMENT_FIELDS}, profiles(full_name,email), programs(title)`)
      .eq('id', id)
      .maybeSingle();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Enrollment not found' };
    return { data: rowToEnrollment(data), error: null };
  },

  async assign(programId: string, studentId: string, options?: {
    startDate?: string;
    targetCompletionDate?: string;
    enrollmentStatus?: string;
    mentorNotes?: string;
  }): Promise<ServiceResponse<ProgramEnrollment>> {
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('program_id', programId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      return this.update(existing.id, {
        enrollment_status: options?.enrollmentStatus || 'Assigned',
        start_date: options?.startDate,
        target_completion_date: options?.targetCompletionDate,
        mentor_notes: options?.mentorNotes,
        status: 'active',
      } as any);
    }

    const { data, error } = await supabase
      .from('program_enrollments')
      .insert({
        program_id: programId,
        student_id: studentId,
        status: 'active',
        enrollment_status: options?.enrollmentStatus || 'Assigned',
        start_date: options?.startDate || null,
        target_completion_date: options?.targetCompletionDate || null,
        mentor_notes: options?.mentorNotes || null,
        completed_modules: 0,
        remaining_modules: 0,
        percentage_complete: 0,
      })
      .select(ENROLLMENT_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToEnrollment(data), error: null };
  },

  async assignMultiple(programIds: string[], studentId: string, options?: {
    startDate?: string;
    targetCompletionDate?: string;
    enrollmentStatus?: string;
    mentorNotes?: string;
  }): Promise<ServiceResponse<ProgramEnrollment[]>> {
    const results: ProgramEnrollment[] = [];
    for (const programId of programIds) {
      const result = await this.assign(programId, studentId, options);
      if (result.data) results.push(result.data);
    }
    return { data: results, error: null };
  },

  async update(id: string, updates: Partial<ProgramEnrollment>): Promise<ServiceResponse<ProgramEnrollment>> {
    const row: Record<string, any> = {};
    if (updates.enrollment_status !== undefined) row.enrollment_status = updates.enrollment_status;
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.start_date !== undefined) row.start_date = updates.start_date;
    if (updates.target_completion_date !== undefined) row.target_completion_date = updates.target_completion_date;
    if (updates.mentor_notes !== undefined) row.mentor_notes = updates.mentor_notes;
    if (updates.student_notes !== undefined) row.student_notes = updates.student_notes;
    if (updates.completed_modules !== undefined) row.completed_modules = updates.completed_modules;
    if (updates.remaining_modules !== undefined) row.remaining_modules = updates.remaining_modules;
    if (updates.percentage_complete !== undefined) row.percentage_complete = updates.percentage_complete;
    if (updates.current_module_id !== undefined) row.current_module_id = updates.current_module_id;
    if (updates.last_activity !== undefined) row.last_activity = updates.last_activity;
    if (updates.completed_at !== undefined) row.completed_at = updates.completed_at;

    const { data, error } = await supabase
      .from('program_enrollments')
      .update(row)
      .eq('id', id)
      .select(ENROLLMENT_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToEnrollment(data), error: null };
  },

  async remove(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('program_enrollments')
      .delete()
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async bulkRemove(ids: string[]): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('program_enrollments')
      .delete()
      .in('id', ids);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },
};
