import { supabase } from '../lib/supabase';
import { Program, ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

const PROGRAM_FIELDS = `
  id,title,description,short_description,full_description,duration,mentor_id,
  image,thumbnail,cover_banner,category,difficulty,outcomes,learning_objectives,
  progress,status,student_count,visibility,skills_covered,prerequisites,tags,
  program_order,max_students,created_at,updated_at,deleted_at,curriculum
`;

const CAMEL_TO_SNAKE: Record<string, string> = {
  mentor: 'mentor_id',
  studentCount: 'student_count',
  skillsCovered: 'skills_covered',
  shortDescription: 'short_description',
  fullDescription: 'full_description',
  coverBanner: 'cover_banner',
  programOrder: 'program_order',
  maxStudents: 'max_students',
  learningObjectives: 'learning_objectives',
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
  if (p.image && !p.thumbnail) p.thumbnail = p.image;
  return p as Program;
}

function programToRow(program: Partial<Program>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(program)) {
    if (key === 'id' || key === 'progress' || val === undefined) continue;
    const col = (CAMEL_TO_SNAKE as any)[key] || key;
    row[col] = val;
  }
  return row;
}

export const programService = {
  async fetchAll(options?: { mentorId?: string; status?: string; visibility?: string }): Promise<ServiceResponse<Program[]>> {
    let query = supabase
      .from('programs')
      .select(PROGRAM_FIELDS)
      .order('program_order', { ascending: true })
      .order('title');

    if (options?.mentorId) {
      query = query.eq('mentor_id', options.mentorId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.visibility) {
      query = query.eq('visibility', options.visibility);
    }

    query = query.is('deleted_at', null);

    const { data, error } = await query;
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToProgram), error: null };
  },

  async fetchPublished(): Promise<ServiceResponse<Program[]>> {
    return this.fetchAll({ status: 'published', visibility: 'public' });
  },

  async insert(program: Partial<Program>): Promise<ServiceResponse<Program>> {
    const row: Record<string, any> = {
      ...programToRow(program),
      status: program.status || 'draft',
    };
    const { data, error } = await supabase
      .from('programs')
      .insert(row)
      .select(PROGRAM_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToProgram(data), error: null };
  },

  async duplicate(id: string): Promise<ServiceResponse<Program>> {
    const original = await this.getById(id);
    if (original.error || !original.data) return { data: null, error: original.error || 'Program not found' };
    const p = original.data;
    const { data, error } = await supabase
      .from('programs')
      .insert({
        mentor_id: p.mentor,
        title: `${p.title} (Copy)`,
        description: p.description,
        short_description: p.short_description,
        full_description: p.full_description,
        duration: p.duration,
        category: p.category,
        difficulty: p.difficulty,
        image: p.image,
        thumbnail: p.thumbnail,
        cover_banner: p.cover_banner,
        outcomes: p.outcomes || [],
        learning_objectives: p.learning_objectives || [],
        skills_covered: p.skills_covered || [],
        prerequisites: p.prerequisites || [],
        tags: p.tags || [],
        visibility: 'private',
        status: 'draft',
        curriculum: p.curriculum || [],
      })
      .select(PROGRAM_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToProgram(data), error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('programs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async permanentDelete(id: string): Promise<ServiceResponse<void>> {
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
      .select(PROGRAM_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Program not found' };
    return { data: rowToProgram(data), error: null };
  },

  async archive(id: string): Promise<ServiceResponse<Program>> {
    return this.update(id, { status: 'archived' } as any);
  },

  async restore(id: string): Promise<ServiceResponse<Program>> {
    return this.update(id, { status: 'draft' } as any);
  },

  async publish(id: string): Promise<ServiceResponse<Program>> {
    return this.update(id, { status: 'published' } as any);
  },

  async getProgramsByMentor(mentorId: string): Promise<ServiceResponse<Program[]>> {
    return this.fetchAll({ mentorId });
  },
};
