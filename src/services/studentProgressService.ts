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

export const studentProgressService = {
  async initCache(): Promise<void> {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*');
    if (!error && data) {
      progressCache = data.map(fromDb);
    }
  },

  // Synchronous version for backward compat with monolithic components
  calculateProgramProgress(userId: string, programId: string): number {
    const record = progressCache.find(p => p.userId === userId && p.programId === programId);
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
    return fromDb(data);
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
