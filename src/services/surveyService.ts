import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

export const surveyService = {
  async fetchOrCreateCurrent(userId: string): Promise<ServiceResponse<{ id: string }>> {
    const { data: existing } = await supabase
      .from('surveys')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return { data: existing, error: null };
    const { data, error } = await supabase
      .from('surveys')
      .insert({ title: 'Session Audit', created_by: userId })
      .select('id')
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async submitResponse(surveyId: string, userId: string, rating: number, feedback: string): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: surveyId,
        user_id: userId,
        rating,
        feedback,
      })
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  },
};
