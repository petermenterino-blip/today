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
      .insert({ event_id: eventId, user_id: userId, name, registration_status: 'confirmed' });
    if (error) return false;
    try { localStorage.setItem('event_rsvp_sync', Date.now().toString()) } catch (e) { console.error('[eventRsvpService] localStorage write failed:', e); }
    return true;
  },

  async unregister(eventId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    if (error) return false;
    try { localStorage.setItem('event_rsvp_sync', Date.now().toString()) } catch (e) { console.error('[eventRsvpService] localStorage write failed:', e); }
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

  async getAttendeeDetails(eventId: string) {
    const { data } = await supabase
      .from('event_attendees')
      .select('*, profiles!inner(name, email)')
      .eq('event_id', eventId);
    return (data || []).map((a: any) => ({
      userId: a.user_id,
      name: a.profiles?.name || a.name || '',
      email: a.profiles?.email || a.email || '',
      registrationStatus: a.registration_status,
      attendanceStatus: a.attendance_status,
      registeredAt: a.registered_at,
    }));
  },
};
