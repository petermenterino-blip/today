import { supabase } from '../lib/supabase';

export const eventRsvpService = {
  async register(eventId: string, userId: string, name: string = ''): Promise<boolean> {
    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return true;

    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: userId, name });

    if (error) return false;

    try { localStorage.setItem('event_rsvp_sync', Date.now().toString()) } catch {}

    return true;
  },

  async unregister(eventId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) return false;

    try { localStorage.setItem('event_rsvp_sync', Date.now().toString()) } catch {}

    return true;
  },

  async getRegistration(eventId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  },

  async getAttendees(eventId: string): Promise<string[]> {
    const { data } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId);

    return (data || []).map(a => a.user_id);
  },
};
