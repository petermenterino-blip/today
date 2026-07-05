import { supabase } from '../lib/supabase';
import { handleError } from '../lib/serviceHelper';
import type { CustomForm, FormSubmission } from '../types';

export interface FormAssignment {
  id: string;
  form_id: string;
  student_id: string;
  mentor_id: string;
  status: 'awaiting' | 'in_progress' | 'submitted' | 'reviewed' | 'closed';
  assigned_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  closed_at?: string;
  form?: CustomForm;
  student_name?: string;
}

function fromDbForm(row: any): CustomForm {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    fields: row.fields || [],
    assigned_to: row.assigned_to || [],
    created_at: row.created_at,
    created_by: row.created_by,
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
    status: row.status || 'submitted',
    mentor_id: row.mentor_id,
  };
}

function fromDbAssignment(row: any): FormAssignment {
  return {
    id: row.id,
    form_id: row.form_id,
    student_id: row.student_id,
    mentor_id: row.mentor_id,
    status: row.status || 'awaiting',
    assigned_at: row.assigned_at,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    closed_at: row.closed_at,
    form: row.custom_forms ? fromDbForm(row.custom_forms) : undefined,
    student_name: row.student?.name || row.student?.full_name || '',
  };
}

export const customFormService = {
  // ── Forms ──

  async getAllForms(): Promise<CustomForm[]> {
    const { data, error } = await supabase
      .from('custom_forms')
      .select('id,title,description,fields,assigned_to,created_by,created_at,updated_at,deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbForm);
  },

  async getFormById(id: string): Promise<CustomForm | null> {
    const { data, error } = await supabase
      .from('custom_forms')
      .select('id,title,description,fields,assigned_to,created_by,created_at,updated_at,deleted_at')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return fromDbForm(data);
  },

  async createForm(data: Partial<CustomForm> & { created_by?: string }): Promise<CustomForm | null> {
    const { data: created, error } = await supabase
      .from('custom_forms')
      .insert({
        title: data.title,
        description: data.description || '',
        fields: data.fields || [],
        assigned_to: data.assigned_to || [],
        created_by: data.created_by || null,
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

  // ── Form Assignments (Delivery) ──

  async assignFormToStudent(formId: string, studentId: string, mentorId: string): Promise<FormAssignment | null> {
    const { data, error } = await supabase
      .from('form_assignments')
      .upsert({
        form_id: formId,
        student_id: studentId,
        mentor_id: mentorId,
        status: 'awaiting',
      }, { onConflict: 'form_id,student_id' })
      .select()
      .single();

    if (error) {
      console.warn('customFormService.assignFormToStudent:', error);
      return null;
    }
    return fromDbAssignment(data);
  },

  async getAssignmentsByStudentId(studentId: string): Promise<FormAssignment[]> {
    const { data, error } = await supabase
      .from('form_assignments')
      .select('id,form_id,student_id,mentor_id,status,assigned_at,submitted_at,reviewed_at,closed_at,custom_forms(id,title,description,fields),student:profiles!form_assignments_student_id_fkey(id,name,full_name)')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.warn('customFormService.getAssignmentsByStudentId:', error);
      return [];
    }
    return (data || []).map(fromDbAssignment);
  },

  async getAssignmentsByFormId(formId: string): Promise<FormAssignment[]> {
    const { data, error } = await supabase
      .from('form_assignments')
      .select('id,form_id,student_id,mentor_id,status,assigned_at,submitted_at,reviewed_at,closed_at,custom_forms(id,title,description,fields),student:profiles!form_assignments_student_id_fkey(id,name,full_name)')
      .eq('form_id', formId)
      .order('assigned_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbAssignment);
  },

  async getAssignmentsByMentorId(mentorId: string): Promise<FormAssignment[]> {
    const { data, error } = await supabase
      .from('form_assignments')
      .select('id,form_id,student_id,mentor_id,status,assigned_at,submitted_at,reviewed_at,closed_at,custom_forms(id,title,description,fields),student:profiles!form_assignments_student_id_fkey(id,name,full_name)')
      .eq('mentor_id', mentorId)
      .order('assigned_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbAssignment);
  },

  async updateAssignmentStatus(assignmentId: string, status: FormAssignment['status']): Promise<boolean> {
    const updates: Record<string, any> = { status };
    if (status === 'submitted') updates.submitted_at = new Date().toISOString();
    if (status === 'reviewed') updates.reviewed_at = new Date().toISOString();
    if (status === 'closed') updates.closed_at = new Date().toISOString();

    const { error } = await supabase
      .from('form_assignments')
      .update(updates)
      .eq('id', assignmentId);

    return !error;
  },

  async deleteAssignment(assignmentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('form_assignments')
      .delete()
      .eq('id', assignmentId);
    return !error;
  },

  // ── Submissions ──

  async getAllSubmissions(): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('id,form_id,user_id,user_name,responses,status,submitted_at,updated_at,created_at')
      .order('submitted_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbSubmission);
  },

  async getSubmissionsByFormId(formId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('id,form_id,user_id,user_name,responses,status,submitted_at,updated_at,created_at')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbSubmission);
  },

  async getSubmissionsByUserId(userId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('id,form_id,user_id,user_name,responses,status,submitted_at,updated_at,created_at')
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
    status?: string;
  }): Promise<FormSubmission | null> {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: submission.form_id,
        user_id: submission.user_id,
        user_name: submission.user_name,
        responses: submission.responses,
        status: submission.status || 'submitted',
      })
      .select()
      .single();

    if (error) return null;

    const assignment = await this.getAssignmentsByStudentId(submission.user_id);
    const pendingAssignment = assignment.find(a => a.form_id === submission.form_id);
    if (pendingAssignment) {
      await this.updateAssignmentStatus(pendingAssignment.id, 'submitted');
    }

    return fromDbSubmission(data);
  },

  async saveDraft(submission: {
    form_id: string;
    user_id: string;
    user_name: string;
    responses: Record<string, any>;
  }): Promise<FormSubmission | null> {
    const existing = await supabase
      .from('form_submissions')
      .select('id,form_id,user_id,responses,status')
      .eq('form_id', submission.form_id)
      .eq('user_id', submission.user_id)
      .maybeSingle();

    if (existing.data) {
      const { data, error } = await supabase
        .from('form_submissions')
        .update({
          responses: submission.responses,
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.data.id)
        .select()
        .single();
      if (error) return null;
      return fromDbSubmission(data);
    }

    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: submission.form_id,
        user_id: submission.user_id,
        user_name: submission.user_name,
        responses: submission.responses,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return null;
    return fromDbSubmission(data);
  },
};
