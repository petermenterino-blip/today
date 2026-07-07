import { supabase } from '../lib/supabase';
import type { MentorSettings, DashboardLayout } from '../interfaces';

function fromDbSettings(row: any): MentorSettings {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    timezone: row.timezone || 'America/New_York',
    sessionDuration: row.session_duration || 45,
    bufferTime: row.buffer_time || 15,
    notificationsEnabled: row.notifications_enabled ?? true,
    defaultMeetingUrl: row.default_meeting_url,
    workingDays: row.working_days || [1, 2, 3, 4, 5],
    availableHoursStart: row.available_hours_start || '09:00',
    availableHoursEnd: row.available_hours_end || '17:00',
  };
}

function toDbSettings(data: Partial<MentorSettings>): Record<string, any> {
  const db: Record<string, any> = {};
  if (data.mentorId !== undefined) db.mentor_id = data.mentorId;
  if (data.timezone !== undefined) db.timezone = data.timezone;
  if (data.sessionDuration !== undefined) db.session_duration = data.sessionDuration;
  if (data.bufferTime !== undefined) db.buffer_time = data.bufferTime;
  if (data.notificationsEnabled !== undefined) db.notifications_enabled = data.notificationsEnabled;
  if (data.defaultMeetingUrl !== undefined) db.default_meeting_url = data.defaultMeetingUrl;
  if (data.workingDays !== undefined) db.working_days = data.workingDays;
  if (data.availableHoursStart !== undefined) db.available_hours_start = data.availableHoursStart;
  if (data.availableHoursEnd !== undefined) db.available_hours_end = data.availableHoursEnd;
  db.updated_at = new Date().toISOString();
  return db;
}

export const settingsService = {
  async getByMentorId(mentorId: string): Promise<MentorSettings | null> {
    const { data, error } = await supabase
      .from('mentor_settings')
      .select('id,mentor_id,timezone,session_duration,buffer_time,notifications_enabled,default_meeting_url,working_days,available_hours_start,available_hours_end')
      .eq('mentor_id', mentorId)
      .maybeSingle();

    if (error) return null;
    if (!data) return null;
    return fromDbSettings(data);
  },

  async upsert(mentorId: string, settings: Partial<MentorSettings>): Promise<MentorSettings | null> {
    const dbData = toDbSettings({ ...settings, mentorId });

    const { data, error } = await supabase
      .from('mentor_settings')
      .upsert(dbData, { onConflict: 'mentor_id' })
      .select()
      .single();

    if (error) return null;
    return fromDbSettings(data);
  },

};

function fromDbLayout(row: any): DashboardLayout {
  return {
    id: row.id,
    userId: row.user_id,
    layout: row.layout || [],
  };
}

export const dashboardLayoutService = {
  async getByUserId(userId: string): Promise<DashboardLayout | null> {
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .select('id,user_id,layout')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    if (!data) return null;
    return fromDbLayout(data);
  },

  async upsert(userId: string, layout: DashboardLayout['layout']): Promise<DashboardLayout | null> {
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .upsert({ user_id: userId, layout }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return null;
    return fromDbLayout(data);
  },
};
