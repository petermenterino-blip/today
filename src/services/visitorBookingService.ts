import { supabase } from '../lib/supabase';
import { handleError } from '../lib/serviceHelper';

export interface VisitorBooking {
  id?: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  call_type: 'intro' | 'rapid';
  date: string;
  time: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at?: string;
}

export const visitorBookingService = {
  async submit(booking: Omit<VisitorBooking, 'id' | 'created_at' | 'status'>) {
    try {
      const { data, error } = await supabase
        .from('visitor_bookings')
        .insert({
          visitor_name: booking.visitor_name,
          visitor_email: booking.visitor_email,
          visitor_phone: booking.visitor_phone || null,
          call_type: booking.call_type,
          date: booking.date,
          time: booking.time,
          status: 'pending',
        });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async fetchAll() {
    try {
      const { data, error } = await supabase
        .from('visitor_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data: data as VisitorBooking[], error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async updateStatus(id: string, status: VisitorBooking['status']) {
    try {
      const { data, error } = await supabase
        .from('visitor_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },
};