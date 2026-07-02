import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import { edgeFunctionService } from './edgeFunctionService';
import { Application, ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

const APP_COLS = [
  'id', 'user_id', 'email', 'first_name', 'last_name', 'phone_number',
  'discipline', 'reason_for_applying', 'status', 'mentor_type',
  'meeting_preference', 'frequency', 'seriousness', 'location',
  'focus_area', 'program_id', 'role_selected', 'top_strength',
  'needs_focus', 'mentor_notes', 'rejection_reason', 'feedback',
  'created_at', 'updated_at',
] as const;

const CAMEL_TO_SNAKE: Record<string, string> = {
  userEmail: 'email',
  fullName: 'full_name',
  mentorType: 'mentor_type',
  meetingPreference: 'meeting_preference',
  focusArea: 'focus_area',
  programId: 'program_id',
  roleSelected: 'role_selected',
  topStrength: 'top_strength',
  needsFocus: 'needs_focus',
  mentorNotes: 'mentor_notes',
  rejectionReason: 'rejection_reason',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  linkedinUrl: 'linkedin_url',
  resumeLink: 'resume_link',
  phoneNumber: 'phone_number',
};

function rowToApplication(row: any): Application {
  let extras: any = {};
  try {
    if (typeof row.reason_for_applying === 'string') {
      extras = JSON.parse(row.reason_for_applying);
    } else if (row.reason_for_applying && typeof row.reason_for_applying === 'object') {
      extras = row.reason_for_applying;
    }
  } catch {}

  let mappedStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  if (row.status === 'approved' || row.status === 'invited') mappedStatus = 'approved';
  if (row.status === 'rejected') mappedStatus = 'rejected';

    return {
      id: row.id,
      user_id: row.user_id || undefined,
      user_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      user_email: row.email,
      full_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      linkedin_url: extras.linkedin_url || '',
      portfolio_url: extras.portfolio_url || '',
      resume_link: extras.resume_link || '',
      goal: extras.goals || '',
      message_to_mentor: extras.message_to_mentor || '',
      status: mappedStatus,
      created_at: row.created_at,
      mentor_type: row.discipline,
      phone: row.phone_number,
      meeting_preference: extras.meeting_preference || 'Virtual',
      frequency: extras.frequency || 'Weekly',
      seriousness: extras.seriousness || 10,
      location: extras.location || 'Remote',
      focus_area: extras.focus_area || row.discipline || 'General',
      program_id: extras.program_id || '1',
      role_selected: 'student',
      top_strength: extras.top_strength || '',
      needs_focus: extras.needs_focus || '',
    };
}

export interface ApplicationDetails {
  application: any;
  notes: any[];
  requests: any[];
  timeline: any[];
}

export const applicationService = {
  mapDbToApplication: rowToApplication,

  async fetchAll(params?: {
    search?: string;
    status?: string;
    discipline?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<ServiceResponse<{ data: Application[]; count: number }>> {
    let query = supabase.from('applications').select('*', { count: 'exact' });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.discipline) {
      query = query.eq('discipline', params.discipline);
    }
    if (params?.search) {
      const q = `%${params.search.toLowerCase()}%`;
      query = query.or(`email.ilike.${q},first_name.ilike.${q},last_name.ilike.${q}`);
    }

    const sortCol = params?.sortBy || 'created_at';
    const sortAsc = params?.sortOrder === 'asc';
    query = query.order(sortCol, { ascending: sortAsc });

    if (params?.limit) {
      query = query.range(0, params.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) return { data: null, error: handleError(error).error };
    const mapped = (data || []).map(rowToApplication);
    return { data: { data: mapped, count: count ?? mapped.length }, error: null };
  },

  async fetchByEmail(email: string): Promise<ServiceResponse<Application>> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error && error.code !== 'PGRST116') return { data: null, error: handleError(error).error };
    return { data: data ? rowToApplication(data) : null, error: null };
  },

  async submitApplication(app: Omit<Application, 'id' | 'created_at' | 'status'>): Promise<ServiceResponse<Application>> {
    const nameParts = (app.full_name || '').trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || 'Applicant';

    const extras: Record<string, any> = {};
    if (app.goal) extras.goals = app.goal;
    if (app.linkedin_url) extras.linkedin_url = app.linkedin_url;
    if (app.portfolio_url) extras.portfolio_url = app.portfolio_url;
    if (app.resume_link) extras.resume_link = app.resume_link;
    if (app.message_to_mentor) extras.message_to_mentor = app.message_to_mentor;
    if (app.meeting_preference) extras.meeting_preference = app.meeting_preference;
    if (app.frequency) extras.frequency = app.frequency;
    if (app.seriousness) extras.seriousness = app.seriousness;
    if (app.program_id) extras.program_id = app.program_id;
    if (app.location) extras.location = app.location;
    if (app.focus_area) extras.focus_area = app.focus_area;
    if (app.top_strength) extras.top_strength = app.top_strength;
    if (app.needs_focus) extras.needs_focus = app.needs_focus;

    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: app.user_id || null,
        email: app.user_email,
        first_name,
        last_name,
        phone_number: app.phone || null,
        discipline: app.mentor_type || 'General',
        reason_for_applying: extras,
        status: 'pending_review',
        meeting_preference: app.meeting_preference || null,
        frequency: app.frequency || null,
        seriousness: app.seriousness || null,
        location: app.location || null,
        focus_area: app.focus_area || null,
        program_id: app.program_id || null,
        role_selected: 'student',
        top_strength: app.top_strength || null,
        needs_focus: app.needs_focus || null,
      });
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToApplication((data ?? [{}])[0]), error: null };
  },

  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async updateExtras(id: string, extras: Record<string, string>): Promise<ServiceResponse<void>> {
    const { data: existing } = await supabase.from('applications').select('reason_for_applying').eq('id', id).single();
    const merged = { ...(existing?.reason_for_applying || {}), ...extras };
    const { error } = await supabase
      .from('applications')
      .update({ reason_for_applying: merged, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async uploadDocument(file: File, userId?: string): Promise<ServiceResponse<string>> {
    try {
      const path = userId || `applicant_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const url = await storageService.uploadStudentDocument(path, file);
      return { data: url, error: null };
    } catch (err: any) {
      return { data: '', error: handleError(err).error };
    }
  },

  async fetchDetails(id: string): Promise<ServiceResponse<ApplicationDetails>> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return { data: null as any, error: handleError(error).error };
    return {
      data: {
        application: data,
        notes: [],
        requests: [],
        timeline: [],
      },
      error: null,
    };
  },

  async addNote(applicationId: string, note: string, authorId: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('application_notes')
      .insert({ application_id: applicationId, author_id: authorId, content: note })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async editNote(noteId: string, note: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('application_notes')
      .update({ content: note })
      .eq('id', noteId)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async deleteNote(noteId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('application_notes')
      .delete()
      .eq('id', noteId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async requestMoreInfo(id: string, requested_info: string): Promise<ServiceResponse<any>> {
    await supabase
      .from('applications')
      .update({ status: 'more_info_needed', updated_at: new Date().toISOString() })
      .eq('id', id);
    return { data: { id: `req_${Math.random().toString(36).substr(2, 9)}`, requested_info, status: 'pending' }, error: null };
  },

  async submitInfoResponse(requestId: string, submitted_info: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('application_info_requests')
      .update({ response: submitted_info, status: 'responded', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async rejectApplication(id: string, reason: string, feedback?: string): Promise<ServiceResponse<void>> {
    const { data: app, error: fetchError } = await supabase
      .from('applications')
      .select('email, first_name, last_name')
      .eq('id', id)
      .single();
    if (fetchError) return { data: undefined, error: fetchError.message };

    const updates: Record<string, any> = { status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() };
    if (feedback !== undefined) updates.feedback = feedback;
    const { error: updateError } = await supabase.from('applications').update(updates).eq('id', id);
    if (updateError) return { data: undefined, error: updateError.message };

    const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim();
    try {
      await edgeFunctionService.sendEmail(app.email, 'application_update', {
        name: fullName,
        status: 'rejected',
        feedback: feedback || reason,
        programTitle: 'Mentorino Program',
      });
    } catch {
      // Email send failure does not block the rejection
    }

    return { data: undefined, error: null };
  },

  async approveApplication(id: string): Promise<ServiceResponse<any>> {
    const { data: app, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !app) return { data: null, error: fetchError?.message || 'Application not found' };

    const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim();
    const email = app.email;
    const tempPassword = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 18)) + '!Aa1';

    const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: { full_name: fullName, role: 'student' },
      },
    });
    if (signUpError) return { data: null, error: signUpError.message };

    if (signUpData?.user) {
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email,
        name: fullName,
        role: 'student',
        application_status: 'approved',
        first_name: app.first_name || null,
        last_name: app.last_name || null,
      });
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: 'invited', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) return { data: null, error: updateError.message };

    try {
      await edgeFunctionService.sendEmail(email, 'welcome', {
        name: fullName,
        email,
        tempPassword,
      });
    } catch {
      // Email send failure does not block the invitation
    }

    window.dispatchEvent(new Event('user-profile-changed'));

    return {
      data: { id, email, name: fullName },
      error: null,
    };
  },

  async fetchInvitation(email: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('applications')
      .select('id, email, first_name, last_name, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'invited')
      .single();
    if (error && error.code !== 'PGRST116') return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: null };
    return {
      data: {
        token: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      },
      error: null,
    };
  },

  async acceptInvitation(token: string, password: string, first_name: string, last_name: string): Promise<ServiceResponse<string>> {
    const { data: app, error: fetchError } = await supabase
      .from('applications')
      .select('email')
      .eq('id', token)
      .eq('status', 'invited')
      .single();
    if (fetchError || !app) return { data: null, error: fetchError?.message || 'Invalid or expired invitation' };

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: app.email,
      password,
    });
    if (signInError) return { data: null, error: signInError.message };

    return { data: app.email, error: null };
  },
};