import { supabase } from '../lib/supabase';

export interface PlatformContext {
  mentor?: any;
  programs?: any[];
  students?: any[];
  sessions?: any[];
  applications?: any[];
  reviews?: any[];
  goals?: any[];
  tasks?: any[];
  resources?: any[];
  events?: any[];
  analytics?: any;
  notifications?: any[];
  recentActivity?: any[];
  timestamp: string;
}

const PROFILE_FIELDS = 'id,name,email,role,avatar_url,status,created_at,updated_at';
const PROGRAM_FIELDS = 'id,title,description,mentor_id,status,created_at';
const SESSION_FIELDS = 'id,student_id,mentor_id,title,description,status,scheduled_at,start_time,end_time,meeting_url,program_id';
const APPLICATION_FIELDS = 'id,student_id,assigned_mentor,status,created_at,email,name';
const REVIEW_FIELDS = 'id,student_id,mentor_id,rating,feedback,completed_at,scheduled_at,created_at';
const GOAL_FIELDS = 'id,student_id,title,description,status,progress_percentage,created_at';
const TASK_FIELDS = 'id,student_id,mentor_id,title,description,status,due_date,created_at';
const RESOURCE_FIELDS = 'id,title,description,file_type,file_size,category,created_at,uploaded_by,status,visibility';
const EVENT_FIELDS = 'id,title,description,organizer_id,start_date,end_date,status,image,location';
const NOTIFICATION_FIELDS = 'id,user_id,title,message,read,type,link,created_at';

export class ContextEngine {
  private cache = new Map<string, { data: any; expires: number }>();
  private cacheTTL = 30_000;

  private async fetchWithCache(key: string, fetcher: () => Promise<any>): Promise<any> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.data;
    const data = await fetcher();
    this.cache.set(key, { data, expires: Date.now() + this.cacheTTL });
    return data;
  }

  invalidateCache() {
    this.cache.clear();
  }

  async getMentorProfile(userId: string) {
    return this.fetchWithCache(`mentor:${userId}`, async () => {
      const { data } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).single();
      return data;
    });
  }

  async getMentorPrograms(mentorId: string) {
    return this.fetchWithCache(`programs:${mentorId}`, async () => {
      const { data } = await supabase
        .from('programs')
        .select(PROGRAM_FIELDS)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getMentorStudents(mentorId: string) {
    return this.fetchWithCache(`students:${mentorId}`, async () => {
      const { data } = await supabase
        .from('profiles')
        .select(`
          id,name,email,role,avatar_url,status,created_at,
          enrollments!inner(program_id,programs!inner(mentor_id))
        `)
        .eq('enrollments.programs.mentor_id', mentorId)
        .eq('role', 'student');
      return data || [];
    });
  }

  async getUpcomingSessions(mentorId: string, limit = 10) {
    return this.fetchWithCache(`sessions:${mentorId}`, async () => {
      const { data } = await supabase
        .from('sessions')
        .select(SESSION_FIELDS)
        .eq('mentor_id', mentorId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);
      return data || [];
    });
  }

  async getPendingApplications(mentorId: string) {
    return this.fetchWithCache(`applications:${mentorId}`, async () => {
      const { data } = await supabase
        .from('applications')
        .select(APPLICATION_FIELDS)
        .eq('assigned_mentor', mentorId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getPendingReviews(mentorId: string) {
    return this.fetchWithCache(`reviews:${mentorId}`, async () => {
      const { data } = await supabase
        .from('reviews')
        .select(REVIEW_FIELDS)
        .eq('mentor_id', mentorId)
        .is('completed_at', null)
        .order('scheduled_at', { ascending: true });
      return data || [];
    });
  }

  async getMentorGoals(mentorId: string) {
    return this.fetchWithCache(`goals:${mentorId}`, async () => {
      const { data } = await supabase
        .from('goals')
        .select(GOAL_FIELDS)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getMentorTasks(mentorId: string) {
    return this.fetchWithCache(`tasks:${mentorId}`, async () => {
      const { data } = await supabase
        .from('tasks')
        .select(TASK_FIELDS)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getMentorResources(mentorId: string) {
    return this.fetchWithCache(`resources:${mentorId}`, async () => {
      const { data } = await supabase
        .from('resources')
        .select(RESOURCE_FIELDS)
        .eq('uploaded_by', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getUpcomingEvents(mentorId: string) {
    return this.fetchWithCache(`events:${mentorId}`, async () => {
      const { data } = await supabase
        .from('events')
        .select(EVENT_FIELDS)
        .eq('organizer_id', mentorId)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });
      return data || [];
    });
  }

  async getRecentActivity(mentorId: string, limit = 20) {
    return this.fetchWithCache(`activity:${mentorId}`, async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('id,actor_id,action,entity_type,entity_id,target_type,target_id,metadata,created_at')
        .eq('actor_id', mentorId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.fetchWithCache(`notifications:${userId}`, async () => {
      const { data } = await supabase
        .from('notifications')
        .select(NOTIFICATION_FIELDS)
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getStudentDetail(studentId: string, mentorId: string) {
    const [profile, sessions, goals, reviews, resources, applications] = await Promise.all([
      supabase.from('profiles').select(PROFILE_FIELDS).eq('id', studentId).single(),
      supabase.from('sessions').select(SESSION_FIELDS).eq('student_id', studentId).eq('mentor_id', mentorId).order('scheduled_at', { ascending: false }),
      supabase.from('goals').select(GOAL_FIELDS).eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('reviews').select(REVIEW_FIELDS).eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('resource_completions').select('id,user_id,resource_id,completed_at,resources(id,title,file_type)').eq('user_id', studentId),
      supabase.from('applications').select(APPLICATION_FIELDS).eq('student_id', studentId).eq('assigned_mentor', mentorId),
    ]);

    return {
      profile: profile.data,
      sessions: sessions.data || [],
      goals: goals.data || [],
      reviews: reviews.data || [],
      resources: resources.data || [],
      applications: applications.data || [],
    };
  }

  async getProgramDetail(programId: string, mentorId: string) {
    const [program, students, sessions] = await Promise.all([
      supabase.from('programs').select(PROGRAM_FIELDS).eq('id', programId).eq('mentor_id', mentorId).single(),
      supabase.from('enrollments').select('id,student_id,program_id,enrolled_at,profiles(id,name,email,avatar_url)').eq('program_id', programId),
      supabase.from('sessions').select(SESSION_FIELDS).eq('program_id', programId),
    ]);

    return {
      program: program.data,
      students: students.data || [],
      sessions: sessions.data || [],
    };
  }

  async getFullContext(userId: string): Promise<PlatformContext> {
    const mentor = await this.getMentorProfile(userId);
    const [programs, sessions, applications, reviews, goals, tasks, resources, events] = await Promise.all([
      this.getMentorPrograms(userId),
      this.getUpcomingSessions(userId),
      this.getPendingApplications(userId),
      this.getPendingReviews(userId),
      this.getMentorGoals(userId),
      this.getMentorTasks(userId),
      this.getMentorResources(userId),
      this.getUpcomingEvents(userId),
    ]);

    return {
      mentor,
      programs,
      sessions,
      applications,
      reviews,
      goals,
      tasks,
      resources,
      events,
      timestamp: new Date().toISOString(),
    };
  }
}

export const contextEngine = new ContextEngine();
