import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  discipline?: string;
  subject?: string;
  message?: string;
  status: 'new' | 'read' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const SNAKE_TO_CAMEL: Record<string, string> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

function rowToContactSubmission(row: any): ContactSubmission {
  const b: any = {};
  for (const [col, val] of Object.entries(row)) {
    const key = SNAKE_TO_CAMEL[col] || col;
    b[key] = val;
  }
  return b as ContactSubmission;
}

function submissionToRow(b: Partial<ContactSubmission>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(b)) {
    if (val === undefined) continue;
    const col = CAMEL_TO_SNAKE[key] || key;
    row[col] = val;
  }
  return row;
}

export const contactSubmissionService = {
  async submit(data: Omit<ContactSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ServiceResponse<ContactSubmission>> {
    try {
      const row = submissionToRow(data as any);
      row.status = 'new';
      const { data: result, error } = await supabase
        .from('contact_submissions')
        .insert(row)
        .select()
        .single();
      if (error) {
        console.warn('[contactSubmissionService] submit error:', error.message);
        return { data: null, error: handleError(error).error };
      }
      return { data: rowToContactSubmission(result), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async fetchAll(params?: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ServiceResponse<ContactSubmission[]>> {
    try {
      let query = supabase.from('contact_submissions').select('*');

      if (params?.status) query = query.eq('status', params.status);

      if (params?.search) {
        const s = `%${params.search}%`;
        query = query.or(`name.ilike.${s},email.ilike.${s},subject.ilike.${s},message.ilike.${s}`);
      }

      const sortCol = params?.sortBy ? (CAMEL_TO_SNAKE[params.sortBy] || params.sortBy) : 'created_at';
      const sortOrd = params?.sortOrder || 'desc';
      query = query.order(sortCol, { ascending: sortOrd === 'asc' });

      const { data, error } = await query;
      if (error) {
        console.warn('[contactSubmissionService] fetchAll error:', error.message);
        return { data: null, error: handleError(error).error };
      }

      return { data: (data || []).map(rowToContactSubmission), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async updateStatus(id: string, status: ContactSubmission['status']): Promise<ServiceResponse<ContactSubmission>> {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.warn('[contactSubmissionService] updateStatus error:', error.message);
        return { data: null, error: handleError(error).error };
      }
      return { data: rowToContactSubmission(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async archive(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.warn('[contactSubmissionService] archive error:', error.message);
        return { data: undefined, error: handleError(error).error };
      }
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: handleError(err).error };
    }
  },
};
