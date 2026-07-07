import { supabase } from '../lib/supabase';
import type { StudentProfile, StudentTimelineEvent } from '../interfaces';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';

const STUDENT_LIST_FIELDS = 'id,name,email,status,health_status,last_login,growth_score,mentor_id,specialization,current_status,avatar_url,goal_progress,application_status,created_at,updated_at,program_id,tags,notes';

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
    growth_score: row.growth_score ?? 0,
    metrics: row.metrics || { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 },
    mentor_id: row.mentor_id || '',
    specialization: row.specialization || '',
    current_status: row.current_status || row.status || 'active',
    avatar_url: row.avatar_url || '',
    phone: row.phone || '',
    bio: row.bio || '',
    linkedin_url: row.linkedin_url || '',
    resume_link: row.resume_link || '',
    goal_progress: row.goal_progress ?? 0,
    application_status: row.application_status || null,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    timezone: row.timezone || 'UTC',
    location: row.location || '',
    skills: row.skills || [],
    portfolio_url: row.portfolio_url || '',
    github_url: row.github_url || '',
    program_id: row.program_id || '',
    batch: row.batch || '',
    cohort: row.cohort || '',
    invited_at: row.invited_at || null,
    first_login_at: row.first_login_at || null,
    onboarding_completed: row.onboarding_completed || false,
    preferred_meeting_time: row.preferred_meeting_time || '',
    learning_objectives: row.learning_objectives || [],
    focus_area: row.specialization || '',
    full_name: row.name || '',
    user_email: row.email || '',
    social_links: row.social_links || {},
  };
}

export const studentService = {
  async getAll(limit = 200): Promise<StudentProfile[]> {
    const result = await safeQuery(
      'studentService.getAll',
      () => supabase.from('profiles').select(STUDENT_LIST_FIELDS).eq('role', 'student').limit(limit),
      [],
      'students',
    );
    if (result.error) console.warn('studentService.getAll:', interpretError(result.error));
    return (result.data || []).map(fromDbProfile);
  },

  async getByMentor(mentorId: string): Promise<StudentProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(STUDENT_LIST_FIELDS)
      .eq('role', 'student')
      .eq('mentor_id', mentorId);
    if (error) {
      console.warn('studentService.getByMentor:', interpretError(error));
      return [];
    }
    return (data || []).map(fromDbProfile);
  },

  async getById(id: string): Promise<StudentProfile | null> {
    const result = await safeQuery(
      'studentService.getById',
      () => supabase.from('profiles').select(STUDENT_LIST_FIELDS).eq('id', id).eq('role', 'student').single(),
      null,
    );
    if (result.error || !result.data) return null;
    return fromDbProfile(result.data);
  },

  async getByStatus(status: StudentProfile['status']): Promise<StudentProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(STUDENT_LIST_FIELDS)
      .eq('role', 'student')
      .eq('status', status)
      .limit(200);
    if (error) {
      console.warn('studentService.getByStatus:', interpretError(error));
      return [];
    }
    return (data || []).map(fromDbProfile);
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
    if (updates.avatar_url !== undefined) dbData.avatar_url = updates.avatar_url;
    if (updates.phone !== undefined) dbData.phone = updates.phone;
    if (updates.bio !== undefined) dbData.bio = updates.bio;
    if (updates.specialization !== undefined) dbData.specialization = updates.specialization;
    if (updates.linkedin_url !== undefined) dbData.linkedin_url = updates.linkedin_url;
    if (updates.resume_link !== undefined) dbData.resume_link = updates.resume_link;
    if (updates.mentor_id !== undefined) dbData.mentor_id = updates.mentor_id;
    if (updates.program_id !== undefined) dbData.program_id = updates.program_id;
    if (updates.timezone !== undefined) dbData.timezone = updates.timezone;
    if (updates.location !== undefined) dbData.location = updates.location;
    if (updates.skills !== undefined) dbData.skills = updates.skills;
    if (updates.portfolio_url !== undefined) dbData.portfolio_url = updates.portfolio_url;
    if (updates.github_url !== undefined) dbData.github_url = updates.github_url;
    if (updates.onboarding_completed !== undefined) dbData.onboarding_completed = updates.onboarding_completed;
    if (updates.preferred_meeting_time !== undefined) dbData.preferred_meeting_time = updates.preferred_meeting_time;
    if (updates.learning_objectives !== undefined) dbData.learning_objectives = updates.learning_objectives;
    if (updates.batch !== undefined) dbData.batch = updates.batch;
    if (updates.cohort !== undefined) dbData.cohort = updates.cohort;
    if (updates.current_status !== undefined) dbData.current_status = updates.current_status;
    dbData.updated_at = new Date().toISOString();

    const result = await safeMutate(
      'studentService.update',
      () => supabase.from('profiles').update(dbData).eq('id', id).select().single(),
      'students',
    );
    if (result.error || !result.data) return null;
    return fromDbProfile(result.data);
  },

  async create(data: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const result = await safeMutate(
      'studentService.create',
      () => supabase.from('profiles').insert({
        id: data.id || data.user_id,
        name: data.name || '',
        email: data.email || '',
        role: 'student',
        status: data.status || 'active',
        mentor_id: data.mentor_id || null,
        program_id: data.program_id || null,
        avatar_url: data.avatar_url || null,
        phone: data.phone || null,
        bio: data.bio || null,
        specialization: data.specialization || null,
      }).select().single(),
      'students',
    );
    if (result.error || !result.data) return null;
    return fromDbProfile(result.data);
  },

  async searchStudents(query: string): Promise<StudentProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(STUDENT_LIST_FIELDS)
      .eq('role', 'student')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,specialization.ilike.%${query}%`)
      .limit(50);
    if (error) {
      console.warn('studentService.searchStudents:', interpretError(error));
      return [];
    }
    return (data || []).map(fromDbProfile);
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
    const result = await safeQuery(
      'studentTimelineService.getByStudentId',
      () => supabase.from('student_timeline_events').select('id,student_id,type,title,description,timestamp').eq('student_id', studentId).order('timestamp', { ascending: false }),
      [],
    );
    if (result.error) console.warn('studentTimelineService.getByStudentId:', interpretError(result.error));
    return (result.data || []).map(fromDbTimeline);
  },
};
