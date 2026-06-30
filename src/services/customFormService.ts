import { supabase } from '../lib/supabase';
import type { CustomForm, FormSubmission } from '../types';

function fromDbForm(row: any): CustomForm {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    fields: row.fields || [],
    assigned_to: row.assigned_to || [],
    created_at: row.created_at,
  };
}

function fromDbSubmission(row: any): FormSubmission {
  return {
    id: row.id,
    form_id: row.form_id,
    user_id: row.user_id,
    user_name: row.user_name || '',
    responses: row.responses || {},
    submitted_at: row.submitted_at,
  };
}

export const customFormService = {
  // ── Forms ──

  async getAllForms(): Promise<CustomForm[]> {
    const { data, error } = await supabase
      .from('custom_forms')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbForm);
  },

  async getFormById(id: string): Promise<CustomForm | null> {
    const { data, error } = await supabase
      .from('custom_forms')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return fromDbForm(data);
  },

  async createForm(data: Partial<CustomForm>): Promise<CustomForm | null> {
    const { data: created, error } = await supabase
      .from('custom_forms')
      .insert({
        title: data.title,
        description: data.description || '',
        fields: data.fields || [],
        assigned_to: data.assigned_to || [],
      })
      .select()
      .single();

    if (error) return null;
    return fromDbForm(created);
  },

  async updateForm(id: string, data: Partial<CustomForm>): Promise<CustomForm | null> {
    const dbData: Record<string, any> = {};
    if (data.title !== undefined) dbData.title = data.title;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.fields !== undefined) dbData.fields = data.fields;
    if (data.assigned_to !== undefined) dbData.assigned_to = data.assigned_to;

    const { data: updated, error } = await supabase
      .from('custom_forms')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return fromDbForm(updated);
  },

  async deleteForm(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('custom_forms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  },

  // ── Submissions ──

  async getAllSubmissions(): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbSubmission);
  },

  async getSubmissionsByFormId(formId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbSubmission);
  },

  async getSubmissionsByUserId(userId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbSubmission);
  },

  async submitForm(submission: {
    form_id: string;
    user_id: string;
    user_name: string;
    responses: Record<string, any>;
  }): Promise<FormSubmission | null> {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: submission.form_id,
        user_id: submission.user_id,
        user_name: submission.user_name,
        responses: submission.responses,
      })
      .select()
      .single();

    if (error) return null;
    return fromDbSubmission(data);
  },
};
