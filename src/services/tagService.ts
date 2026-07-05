import { supabase } from '../lib/supabase';
import type { StudentTag } from '../types';

function fromDbTag(row: any): StudentTag {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
  };
}

function toDbTag(data: Partial<StudentTag>): Record<string, any> {
  const db: Record<string, any> = {};
  if (data.label !== undefined) db.label = data.label;
  if (data.color !== undefined) db.color = data.color;
  return db;
}

export const tagService = {
  async getAll(): Promise<StudentTag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('id,label,color')
      .order('label', { ascending: true });

    if (error) return [];
    return (data || []).map(fromDbTag);
  },

  async getById(id: string): Promise<StudentTag | null> {
    const { data, error } = await supabase
      .from('tags')
      .select('id,label,color')
      .eq('id', id)
      .single();

    if (error) return null;
    return fromDbTag(data);
  },

  async create(data: Partial<StudentTag>): Promise<StudentTag | null> {
    const { data: created, error } = await supabase
      .from('tags')
      .insert(toDbTag(data))
      .select()
      .single();

    if (error) return null;
    return fromDbTag(created);
  },

  async update(id: string, data: Partial<StudentTag>): Promise<StudentTag | null> {
    const { data: updated, error } = await supabase
      .from('tags')
      .update(toDbTag(data))
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return fromDbTag(updated);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    return !error;
  },

  async seed(tags: StudentTag[]): Promise<void> {
    for (const tag of tags) {
      const { error } = await supabase
        .from('tags')
        .upsert({ id: tag.id, label: tag.label, color: tag.color }, { onConflict: 'id' });

      if (error) console.warn('Tag seed error:', error.message);
    }
  },

  // Student-tag assignment
  async getStudentTags(studentId: string): Promise<StudentTag[]> {
    const { data, error } = await supabase
      .from('student_tags')
      .select('tag_id')
      .eq('student_id', studentId);

    if (error || !data) return [];
    const tagIds = data.map(r => r.tag_id);
    if (tagIds.length === 0) return [];

    const { data: tags } = await supabase
      .from('tags')
      .select('id,label,color')
      .in('id', tagIds);

    return (tags || []).map(fromDbTag);
  },

  async assignTag(studentId: string, tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('student_tags')
      .insert({ student_id: studentId, tag_id: tagId });

    return !error;
  },

  async removeTag(studentId: string, tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('student_tags')
      .delete()
      .eq('student_id', studentId)
      .eq('tag_id', tagId);

    return !error;
  },
};
