import { supabase } from '../lib/supabase';
import type { StudentProfile, StudentTimelineEvent } from '../interfaces';

function fromDbProfile(row: any): StudentProfile {
  return {
    id: row.id,
    user_id: row.id,
    name: row.name || '',
    email: row.email || '',
    status: row.status || 'active',
    healthStatus: row.health_status || 'active',
    tags: row.tags || [],
    lastLogin: row.last_login,
    privateNotes: row.notes || '',
    notes: row.notes || '',
    growth_score: row.growth_score || 0,
    metrics: row.metrics || { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 },
  };
}

export const studentService = {
  async getAll(): Promise<StudentProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .is('deleted_at', null);

    if (error) return [];
    return (data || []).map(fromDbProfile);
  },

  async getById(id: string): Promise<StudentProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (error) return null;
    return fromDbProfile(data);
  },

  async getByStatus(status: StudentProfile['status']): Promise<StudentProfile[]> {
    const all = await this.getAll();
    return all.filter(s => s.status === status);
  },

  async update(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const dbData: Record<string, any> = {};
    if (updates.name !== undefined) dbData.name = updates.name;
    if (updates.email !== undefined) dbData.email = updates.email;
    if (updates.status !== undefined) dbData.status = updates.status;
    if (updates.healthStatus !== undefined) dbData.health_status = updates.healthStatus;
    if (updates.tags !== undefined) dbData.tags = updates.tags;
    if (updates.lastLogin !== undefined) dbData.last_login = updates.lastLogin;
    if (updates.notes !== undefined) dbData.notes = updates.notes;
    if (updates.growth_score !== undefined) dbData.growth_score = updates.growth_score;
    if (updates.metrics !== undefined) dbData.metrics = updates.metrics;
    dbData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return fromDbProfile(data);
  },

  async create(data: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: data.id || data.user_id,
        name: data.name || '',
        email: data.email || '',
        role: 'student',
        status: data.status || 'active',
      })
      .select()
      .single();

    if (error) return null;
    return fromDbProfile(created);
  },

  async seed(profiles: any[]): Promise<void> {
    for (const p of profiles) {
      const existing = await this.getById(p.id || p.user_id);
      if (existing) {
        await this.update(p.id || p.user_id, p);
      } else {
        await this.create(p);
      }
    }
  },
};

function fromDbTimeline(row: any): StudentTimelineEvent {
  return {
    id: row.id,
    studentId: row.student_id,
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp,
  };
}

export const studentTimelineService = {
  async getByStudentId(studentId: string): Promise<StudentTimelineEvent[]> {
    const { data, error } = await supabase
      .from('student_timeline_events')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbTimeline);
  },
};
