import { supabase } from '../lib/supabase';
import { Booking, ServiceResponse } from '../types';
import { notify } from './notificationService';

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
  async fetchAll(): Promise<ServiceResponse<Booking[]>> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: (data || []).map(rowToBooking), error: null };
  },

  async insert(booking: Omit<Booking, 'id'>): Promise<ServiceResponse<Booking>> {
    const row = { ...bookingToRow(booking as any) };
    delete row.id;
    const { data, error } = await supabase
      .from('bookings')
      .insert(row)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    const created = rowToBooking(data);
    notify.bookingConfirmed(created.user_id, created.mentor_id || '', created.date, created.time).catch(() => {});
    return { data: created, error: null };
  },
};