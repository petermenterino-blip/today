import { supabase } from '../lib/supabase';
import { timelineService } from './timelineService';

export const crmInitializationService = {
  async initializeStudentCrm(params: {
    userId: string;
    email: string;
    name: string;
    applicationId: string;
    programId?: string | null;
    focusArea?: string | null;
    mentorId?: string;
  }): Promise<void> {
    const { userId, email, name, applicationId, programId, focusArea, mentorId } = params;
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existing) {
      const updates: Record<string, any> = {
        updated_at: now,
      };

      if (!existing.health_status) updates.health_status = 'active';
      if (!existing.status || existing.status === 'applied') updates.status = 'active';
      if (!existing.metrics || Object.keys(existing.metrics).length === 0) {
        updates.metrics = { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 };
      }
      if (existing.growth_score === null || existing.growth_score === undefined) {
        updates.growth_score = 0;
      }
      if (mentorId && !existing.mentor_id) {
        updates.mentor_id = mentorId;
      }
      if (focusArea && !existing.specialization) {
        updates.specialization = focusArea;
      }
      if (programId && !existing.program_id) {
        updates.program_id = programId;
      }
      updates.application_status = 'approved';

      if (Object.keys(updates).length > 1) {
        await supabase.from('profiles').update(updates).eq('id', userId);
      }
    }

    await timelineService.autoLogApplicationApproved(userId, mentorId);

    const { data: existingProgress } = await supabase
      .from('student_progress')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProgress && programId) {
      await supabase.from('student_progress').insert({
        user_id: userId,
        program_id: programId,
        started_at: now,
        lessons: {},
      });
    }

    const { data: existingDashboard } = await supabase
      .from('dashboard_layouts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingDashboard) {
      await supabase.from('dashboard_layouts').insert({
        user_id: userId,
        layout: [],
      });
    }

    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'student_approved',
      properties: {
        application_id: applicationId,
        approved_at: now,
        name,
        email,
        focus_area: focusArea || null,
      },
    });

    await supabase.from('student_timeline_events').insert({
      student_id: userId,
      type: 'application_approved',
      title: 'Student Approved & CRM Initialized',
      description: `${name} was approved and all CRM records were automatically created.`,
      timestamp: now,
      mentor_id: mentorId || null,
      category: 'system',
    });

    const { data: existingGoals } = await supabase
      .from('goals')
      .select('id')
      .eq('student_id', userId)
      .limit(1);

    if (!existingGoals || existingGoals.length === 0) {
      const defaultGoals = [
        { title: 'Complete Program Onboarding', description: 'Complete the initial onboarding process to set up your learning journey.', status: 'not_started', progress_percentage: 0 },
        { title: 'Define Career Goals', description: 'Identify and document your short-term and long-term career objectives.', status: 'not_started', progress_percentage: 0 },
      ];
      for (const goal of defaultGoals) {
        await supabase.from('goals').insert({
          student_id: userId,
          title: goal.title,
          description: goal.description,
          status: goal.status,
          progress_percentage: goal.progress_percentage,
        });
      }
    }

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .or(`mentor_id.eq.${mentorId || 'none'},student_id.eq.${userId}`)
      .limit(1);

    if (!existingConversation || existingConversation.length === 0) {
      const convId = crypto.randomUUID();
      await supabase.from('conversations').insert({
        id: convId,
        mentor_id: mentorId || null,
        student_id: userId,
        last_message: null,
        last_message_at: null,
      });
      await supabase.from('conversation_participants').insert([
        { conversation_id: convId, user_id: mentorId || null },
        { conversation_id: convId, user_id: userId },
      ]);
    }
  },

  async ensureStudentCrmExists(userId: string, mentorId?: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return false;

      const now = new Date().toISOString();

      if (profile.role !== 'student') {
        await supabase.from('profiles').update({ role: 'student', updated_at: now }).eq('id', userId);
      }

      if (mentorId && !profile.mentor_id) {
        await supabase.from('profiles').update({ mentor_id: mentorId, updated_at: now }).eq('id', userId);
      }

      if (!profile.health_status) {
        await supabase.from('profiles').update({ health_status: 'active', updated_at: now }).eq('id', userId);
      }
      if (!profile.metrics || Object.keys(profile.metrics).length === 0) {
        await supabase.from('profiles').update({
          metrics: { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 },
          updated_at: now,
        }).eq('id', userId);
      }
      if (profile.growth_score === null || profile.growth_score === undefined) {
        await supabase.from('profiles').update({ growth_score: 0, updated_at: now }).eq('id', userId);
      }

      const { data: existingProgress } = await supabase
        .from('student_progress')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProgress) {
        await supabase.from('student_progress').insert({
          user_id: userId,
          program_id: profile.program_id || null,
          started_at: now,
          lessons: {},
        });
      }

      const { data: existingDashboard } = await supabase
        .from('dashboard_layouts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingDashboard) {
        await supabase.from('dashboard_layouts').insert({
          user_id: userId,
          layout: [],
        });
      }

      const { data: existingGoals } = await supabase
        .from('goals')
        .select('id')
        .eq('student_id', userId)
        .limit(1);

      if (!existingGoals || existingGoals.length === 0) {
        const defaultGoals = [
          { title: 'Complete Program Onboarding', description: 'Complete the initial onboarding process.', status: 'not_started', progress_percentage: 0 },
          { title: 'Define Career Goals', description: 'Identify and document your career objectives.', status: 'not_started', progress_percentage: 0 },
        ];
        for (const goal of defaultGoals) {
          await supabase.from('goals').insert({
            student_id: userId,
            title: goal.title,
            description: goal.description,
            status: goal.status,
            progress_percentage: goal.progress_percentage,
          });
        }
      }

      return true;
    } catch {
      return false;
    }
  },
};
