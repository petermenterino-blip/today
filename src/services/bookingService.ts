import { supabase } from '../lib/supabase';
import { Booking, NetworkEvent, ServiceResponse } from '../types';
import { notify } from './notificationService';
import { handleError } from '../lib/serviceHelper';

function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    user_id: row.user_id,
    mentor_id: row.mentor_id || '',
    user_name: row.user_name || '',
    program_id: row.program_id,
    date: row.date || '',
    time: row.time || '',
    type: row.type,
    status: row.status,
    meeting_link: row.meeting_link,
    notes: row.notes,
    attendance: row.attendance,
    created_at: row.created_at,
  };
}

async function checkTimeslotConflict(userId: string, date: string, time: string): Promise<string | null> {
  const { data: existing, error } = await supabase
    .from('bookings')
    .select('id, date, time')
    .eq('user_id', userId)
    .eq('date', date)
    .neq('status', 'cancelled');

  if (error) return null;

  if (existing?.some(b => b.time === time)) {
    return 'You already have a booking at this time';
  }

  return null;
}

async function checkEventCapacity(eventId: string): Promise<string | null> {
  const { data: event, error } = await supabase
    .from('events')
    .select('capacity')
    .eq('id', eventId)
    .single();

  if (error || !event) return null;
  if (!event.capacity) return null;

  const { count } = await supabase
    .from('event_attendees')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (count !== null && count >= event.capacity) {
    return 'This event has reached its capacity';
  }

  return null;
}

function bookingToRow(b: Partial<Booking>): Record<string, any> {
  const row: Record<string, any> = {};
  if (b.user_id !== undefined) row.user_id = b.user_id;
  if (b.mentor_id !== undefined) row.mentor_id = b.mentor_id;
  if (b.user_name !== undefined) row.user_name = b.user_name;
  if (b.program_id !== undefined) row.program_id = b.program_id;
  if (b.date !== undefined) row.date = b.date;
  if (b.time !== undefined) row.time = b.time;
  if (b.type !== undefined) row.type = b.type;
  if (b.status !== undefined) row.status = b.status;
  if (b.meeting_link !== undefined) row.meeting_link = b.meeting_link;
  if (b.notes !== undefined) row.notes = b.notes;
  if (b.attendance !== undefined) row.attendance = b.attendance;
  return row;
}

export const bookingService = {
  async fetchAll(userId?: string, limit = 50, offset = 0): Promise<ServiceResponse<Booking[]>> {
    let query = supabase
      .from('bookings')
      .select('id, user_id, mentor_id, user_name, program_id, date, time, type, status, meeting_link, notes, attendance, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.or(`user_id.eq.${userId},mentor_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToBooking), error: null };
  },

  async insert(booking: Omit<Booking, 'id'>): Promise<ServiceResponse<Booking>> {
    const conflict = await checkTimeslotConflict(booking.user_id, booking.date, booking.time);
    if (conflict) return { data: null, error: conflict };

    if (booking.program_id) {
      const cap = await checkEventCapacity(booking.program_id);
      if (cap) return { data: null, error: cap };
    }

    const row = { ...bookingToRow(booking as any) };
    delete row.id;
    const { data, error } = await supabase
      .from('bookings')
      .insert(row)
      .select()
      .single();
    if (error) return { data: null, error: handleError(error).error };
    const created = rowToBooking(data);
    notify.bookingConfirmed(created.user_id, created.mentor_id || '', created.date, created.time).catch(() => {});
    return { data: created, error: null };
  },
};