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
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    });
  }

  async getMentorPrograms(mentorId: string) {
    return this.fetchWithCache(`programs:${mentorId}`, async () => {
      const { data } = await supabase
        .from('programs')
        .select('*')
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
          *,
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
        .select('*')
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
        .select('*')
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
        .select('*')
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
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getMentorTasks(mentorId: string) {
    return this.fetchWithCache(`tasks:${mentorId}`, async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getMentorResources(mentorId: string) {
    return this.fetchWithCache(`resources:${mentorId}`, async () => {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by', mentorId)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getUpcomingEvents(mentorId: string) {
    return this.fetchWithCache(`events:${mentorId}`, async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
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
        .select('*')
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
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });
      return data || [];
    });
  }

  async getStudentDetail(studentId: string, mentorId: string) {
    const [profile, sessions, goals, reviews, resources, applications] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', studentId).single(),
      supabase.from('sessions').select('*').eq('student_id', studentId).eq('mentor_id', mentorId).order('scheduled_at', { ascending: false }),
      supabase.from('goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('resource_completions').select('*, resources(*)').eq('user_id', studentId),
      supabase.from('applications').select('*').eq('student_id', studentId).eq('assigned_mentor', mentorId),
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
      supabase.from('programs').select('*').eq('id', programId).eq('mentor_id', mentorId).single(),
      supabase.from('enrollments').select('*, profiles(*)').eq('program_id', programId),
      supabase.from('sessions').select('*').eq('program_id', programId),
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
