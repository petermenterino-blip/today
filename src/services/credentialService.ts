import { supabase } from '../lib/supabase';
import { handleError } from '../lib/serviceHelper';

export interface Credential {
  id: string;
  student_id: string;
  title: string;
  description: string;
  issued_by: string;
  issued_at: string;
  type: 'badge' | 'certificate' | 'award';
}

export const credentialService = {
  async issue(cred: Omit<Credential, 'id' | 'issued_at'>): Promise<Credential | null> {
    const { data, error } = await supabase
      .from('credentials')
      .insert({
        student_id: cred.student_id,
        title: cred.title,
        description: cred.description,
        issued_by: cred.issued_by,
        type: cred.type,
      })
      .select()
      .single();

    if (error) {
      console.warn('credentialService.issue:', handleError(error).error);
      return null;
    }

    await supabase.from('student_timeline_events').insert({
      student_id: cred.student_id,
      event_type: 'credential_issued',
      title: `${cred.type}: ${cred.title}`,
      description: cred.description,
    }).maybeSingle();

    return data as Credential;
  },

  async getByStudentId(studentId: string): Promise<Credential[]> {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('student_id', studentId)
      .order('issued_at', { ascending: false });

    if (error) {
      console.warn('credentialService.getByStudentId:', handleError(error).error);
      return [];
    }

    return (data || []) as Credential[];
  },
};
