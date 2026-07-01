import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';
import { storageService } from './storageService';
import { handleError } from '../lib/serviceHelper';

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
  bio?: string;
  discipline?: string;
  github_url?: string;
  linkedin_url?: string;
  specialties?: string[];
  google_calendar_connected?: boolean;
  google_calendar_email?: string;
}

function toDbColumns(data: UserProfileUpdate): Record<string, any> {
  const db: Record<string, any> = {};
  const first = data.first_name || '';
  const last = data.last_name || '';
  if (data.first_name !== undefined || data.last_name !== undefined) {
    db.name = `${first} ${last}`.trim();
  }
  if (data.email !== undefined) db.email = data.email;
  if (data.avatar_url !== undefined) db.avatar_url = data.avatar_url;
  if (data.phone_number !== undefined) db.phone = data.phone_number;
  if (data.bio !== undefined) db.bio = data.bio;
  if (data.discipline !== undefined) db.specialization = data.discipline;
  if (data.linkedin_url !== undefined) db.linkedin_url = data.linkedin_url;
  return db;
}

function fromDbColumns(row: any): any {
  if (!row) return null;
  const parts = (row.name || '').split(/\s+/);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || '',
    email: row.email || '',
    avatar_url: row.avatar_url || '',
    phone_number: row.phone || '',
    bio: row.bio || '',
    discipline: row.specialization || '',
    linkedin_url: row.linkedin_url || '',
  };
}

export const profileService = {
  async getProfile(userId: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      return { data: null, error: handleError(error).error };
    }
    return { data: fromDbColumns(data), error: null };
  },

  async updateProfile(userId: string, data: UserProfileUpdate): Promise<ServiceResponse<void>> {
    const dbData = toDbColumns(data);
    if (Object.keys(dbData).length === 0) return { data: undefined, error: null };

    const { error } = await supabase
      .from('profiles')
      .update({ ...dbData, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async uploadAvatar(userId: string, file: File): Promise<ServiceResponse<string>> {
    try {
      const url = await storageService.uploadAvatar(userId, file);
      return { data: url, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getProfileSettings(profileId: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, settings')
      .eq('id', profileId)
      .single();
    if (error && error.code !== 'PGRST116') {
      return { data: {}, error: handleError(error).error };
    }
    return { data: { ...(data?.settings || {}), username: data?.username || '' }, error: null };
  },

  async updateProfileSettings(profileId: string, settings: any): Promise<ServiceResponse<void>> {
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('settings, username')
      .eq('id', profileId)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      return { data: undefined, error: fetchError.message };
    }

    const updates: Record<string, any> = {
      settings: { ...(existing?.settings || {}), ...settings, updated_at: new Date().toISOString() },
    };
    if (settings.username !== undefined) updates.username = settings.username;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async getSystemSetting(key: string): Promise<ServiceResponse<any>> {
    return { data: null, error: null };
  },

  async updateSystemSetting(key: string, value: any, description?: string): Promise<ServiceResponse<void>> {
    return { data: undefined, error: null };
  }
};
