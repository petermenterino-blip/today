import { supabase } from '../lib/supabase';
import { Program, ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

const PROGRAM_FIELDS = 'id,title,description,duration,mentor_id,image,category,difficulty,outcomes,progress,status,student_count,visibility,skills_covered,prerequisites,max_students,created_at,updated_at';

const CAMEL_TO_SNAKE: Record<string, string> = {
  mentor: 'mentor_id',
  image: 'cover_image',
  studentCount: 'student_count',
  skillsCovered: 'skills_covered',
};

const SNAKE_TO_CAMEL: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([k, v]) => [v, k])
);

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
      .select(PROGRAM_FIELDS)
      .order('title');
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

  async getById(id: string): Promise<ServiceResponse<Program>> {
    const { data, error } = await supabase
      .from('programs')
      .select(PROGRAM_FIELDS)
      .eq('id', id)
      .maybeSingle();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Program not found' };
    return { data: rowToProgram(data), error: null };
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
  }
};