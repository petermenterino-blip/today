import { supabase } from '../lib/supabase';
import { Program, ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

const CAMEL_TO_SNAKE: Record<string, string> = {
  mentor: 'mentor_id',
  image: 'cover_image',
  studentCount: 'student_count',
  skillsCovered: 'skills_covered',
};

const SNAKE_TO_CAMEL: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([k, v]) => [v, k])
);

export interface ProgramEnrollment {
  id: string;
  program_id: string;
  student_id: string;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
  completed_at?: string;
  student_name?: string;
  student_email?: string;
}

function rowToProgram(row: any): Program {
  const p: any = { id: row.id };
  for (const [col, val] of Object.entries(row)) {
    if (col === 'id') continue;
    const key = (SNAKE_TO_CAMEL as any)[col] || col;
    p[key] = val;
  }
  if (p.mentor_id !== undefined) p.mentor = p.mentor_id;
  delete p.mentor_id;
  if (p.cover_image !== undefined) p.image = p.cover_image;
  delete p.cover_image;
  if (p.progress === undefined) p.progress = 0;
  return p as Program;
}

function programToRow(program: Partial<Program>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(program)) {
    if (key === 'id' || key === 'progress') continue;
    const col = (CAMEL_TO_SNAKE as any)[key] || key;
    row[col] = val;
  }
  return row;
}

export const programService = {
  async fetchAll(): Promise<ServiceResponse<Program[]>> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .is('deleted_at', null)
      .order('title');
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToProgram), error: null };
  },

  async fetchArchived(): Promise<ServiceResponse<Program[]>> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToProgram), error: null };
  },

  async insert(program: Omit<Program, 'id' | 'progress' | 'status'>): Promise<ServiceResponse<Program>> {
    const row: Record<string, any> = { ...programToRow(program as any), status: 'draft' };
    const { data, error } = await supabase
      .from('programs')
      .insert(row)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToProgram(data), error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async update(id: string, program: Partial<Program>): Promise<ServiceResponse<Program>> {
    const row = programToRow(program);
    const { data, error } = await supabase
      .from('programs')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Program not found' };
    return { data: rowToProgram(data), error: null };
  },

  async duplicate(id: string): Promise<ServiceResponse<Program>> {
    const { data: original, error: fetchError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) return { data: null, error: handleError(fetchError).error };
    if (!original) return { data: null, error: 'Program not found' };

    const { data, error } = await supabase
      .from('programs')
      .insert({
        mentor_id: original.mentor_id,
        title: `${original.title} (Copy)`,
        description: original.description,
        duration: original.duration,
        category: original.category,
        difficulty: original.difficulty,
        image: original.image,
        status: 'draft',
        visibility: original.visibility,
        outcomes: original.outcomes,
        skills_covered: original.skills_covered,
        prerequisites: original.prerequisites,
        modules: original.modules,
        resources: original.resources,
        assignments: original.assignments,
        max_students: original.max_students,
      })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToProgram(data), error: null };
  },

  async archive(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('programs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async unarchive(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('programs')
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async fetchEnrollments(programId: string): Promise<ServiceResponse<ProgramEnrollment[]>> {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select(`
        *,
        student:student_id ( name, email )
      `)
      .eq('program_id', programId);
    if (error) return { data: null, error: handleError(error).error };
    const enrollments: ProgramEnrollment[] = (data || []).map((row: any) => ({
      id: row.id,
      program_id: row.program_id,
      student_id: row.student_id,
      status: row.status,
      enrolled_at: row.enrolled_at,
      completed_at: row.completed_at,
      student_name: row.student?.name,
      student_email: row.student?.email,
    }));
    return { data: enrollments, error: null };
  },

  async enrollStudent(programId: string, studentId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('program_enrollments')
      .insert({ program_id: programId, student_id: studentId });
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async unenrollStudent(programId: string, studentId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('program_enrollments')
      .delete()
      .eq('program_id', programId)
      .eq('student_id', studentId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'completed' | 'dropped'): Promise<ServiceResponse<void>> {
    const updates: Record<string, any> = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    const { error } = await supabase
      .from('program_enrollments')
      .update(updates)
      .eq('id', enrollmentId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async fetchStudentsNotEnrolled(programId: string, mentorId: string): Promise<ServiceResponse<any[]>> {
    const { data: enrolled, error: enrolledError } = await supabase
      .from('program_enrollments')
      .select('student_id')
      .eq('program_id', programId);
    if (enrolledError) return { data: null, error: handleError(enrolledError).error };

    const enrolledIds = (enrolled || []).map(e => e.student_id);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'student')
      .not('id', 'in', `(${enrolledIds.length ? enrolledIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);
    if (error) return { data: null, error: handleError(error).error };
    return { data: data || [], error: null };
  },
};
