import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

export interface StudentProgress {
  userId: string;
  programId: string;
  startedAt?: string;
  completedAt?: string;
  lessons: Record<string, {
    completedTopics: string[];
    videoPosition?: number;
    quizCompleted?: boolean;
    assignmentSubmitted?: boolean;
    completedAt?: string;
  }>;
}

function fromDb(row: any): StudentProgress {
  return {
    userId: row.user_id,
    programId: row.program_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    lessons: row.lessons || {},
  };
}

let progressCache: StudentProgress[] = [];
let progressCacheMap = new Map<string, StudentProgress>();

export const studentProgressService = {
  async initCache(): Promise<void> {
    const records = await this.getProgressBatch();
    progressCache = records;
    progressCacheMap = new Map();
    records.forEach(r => {
      progressCacheMap.set(`${r.userId}-${r.programId}`, r);
    });
  },

  async getProgressBatch(userIds?: string[], programIds?: string[]): Promise<StudentProgress[]> {
    let query = supabase.from('student_progress').select('*');
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }
    if (programIds && programIds.length > 0) {
      query = query.in('program_id', programIds);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(fromDb);
  },

  // Synchronous version for backward compat with monolithic components
  calculateProgramProgress(userId: string, programId: string): number {
    const record = progressCacheMap.get(`${userId}-${programId}`) || progressCache.find(p => p.userId === userId && p.programId === programId);
    if (!record) return 0;
    const lessonIds = Object.keys(record.lessons);
    if (lessonIds.length === 0) return 0;
    const completed = lessonIds.filter(id =>
      record.lessons[id].quizCompleted || record.lessons[id].assignmentSubmitted
    ).length;
    return Math.round((completed / lessonIds.length) * 100);
  },

  async getProgress(userId: string, programId: string): Promise<StudentProgress | null> {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .maybeSingle();

    if (error || !data) return null;
    const record = fromDb(data);
    const key = `${userId}-${programId}`;
    progressCacheMap.set(key, record);
    const idx = progressCache.findIndex(p => p.userId === userId && p.programId === programId);
    if (idx >= 0) progressCache[idx] = record;
    else progressCache.push(record);
    return record;
  },

  async startProgram(userId: string, programId: string): Promise<ServiceResponse<StudentProgress>> {
    const existing = await this.getProgress(userId, programId);
    if (existing) return { data: existing, error: null };

    const { data, error } = await supabase
      .from('student_progress')
      .insert({
        user_id: userId,
        program_id: programId,
        started_at: new Date().toISOString(),
        lessons: {},
      })
      .select()
      .single();

    if (error) return { data: null, error: handleError(error).error };
    return { data: fromDb(data), error: null };
  },

  async updateLessonProgress(
    userId: string,
    programId: string,
    lessonId: string,
    updates: Partial<NonNullable<StudentProgress['lessons'][string]>>
  ): Promise<ServiceResponse<StudentProgress>> {
    const current = await this.getProgress(userId, programId);

    const currentLessons = current?.lessons || {};
    const currentLesson = currentLessons[lessonId] || { completedTopics: [] };

    const updatedLessons = {
      ...currentLessons,
      [lessonId]: {
        ...currentLesson,
        ...updates,
      },
    };

    const { data, error } = await supabase
      .from('student_progress')
      .upsert({
        user_id: userId,
        program_id: programId,
        started_at: current?.startedAt || new Date().toISOString(),
        lessons: updatedLessons,
      }, { onConflict: 'user_id, program_id' })
      .select()
      .single();

    if (error) return { data: null, error: handleError(error).error };
    return { data: fromDb(data), error: null };
  },

  async seed(progressList: StudentProgress[]): Promise<void> {
    for (const p of progressList) {
      await supabase
        .from('student_progress')
        .upsert({
          user_id: p.userId,
          program_id: p.programId,
          started_at: p.startedAt || new Date().toISOString(),
          completed_at: p.completedAt || null,
          lessons: p.lessons || {},
        }, { onConflict: 'user_id, program_id' });
    }
  },
};
