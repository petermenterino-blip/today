import { supabase } from '../lib/supabase';
import { NetworkEvent, ServiceResponse } from '../types';

function rowToEvent(row: any, attendees: string[] = []): NetworkEvent {
  const e: any = { id: row.id };
  for (const [col, val] of Object.entries(row)) {
    if (col === 'id' || col === 'event_attendees') continue;
    const key = EVENT_SNAKE_TO_CAMEL[col] || col;
    e[key] = val;
  }
  e.attendees = attendees;
  e.registrations = [];
  e.files = [];
  e.recording = undefined;
  e.feedbacks = [];
  return e as NetworkEvent;
}

const EVENT_CAMEL_TO_SNAKE: Record<string, string> = {
  endTime: 'end_time',
  meetingLink: 'meeting_link',
  coverImage: 'cover_image',
  registrationDeadline: 'registration_deadline',
  waitlistLimit: 'waitlist_limit',
  resourceFiles: 'resource_files',
  eventColor: 'event_color',
};

const EVENT_SNAKE_TO_CAMEL: Record<string, string> = {
  end_time: 'endTime',
  meeting_link: 'meetingLink',
  cover_image: 'coverImage',
  registration_deadline: 'registrationDeadline',
  waitlist_limit: 'waitlistLimit',
  resource_files: 'resourceFiles',
  event_color: 'eventColor',
};

function eventToRow(e: Partial<NetworkEvent>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(e)) {
    if (val === undefined) continue;
    const col = EVENT_CAMEL_TO_SNAKE[key] || key;
    row[col] = val;
  }
  return row;
}

export const eventService = {
  async fetchAll(): Promise<ServiceResponse<NetworkEvent[]>> {
    const { data, error } = await supabase
      .from('events')
      .select('*, event_attendees(user_id)')
      .order('date');
    if (error) return { data: null, error: error.message };
    const events = (data || []).map((row: any) => {
      const attendees = (row.event_attendees || []).map((a: any) => a.user_id);
      return rowToEvent(row, attendees);
    });
    return { data: events, error: null };
  },

  async insert(event: Omit<NetworkEvent, 'id'>): Promise<ServiceResponse<NetworkEvent>> {
    const row = eventToRow(event as any);
    const { data, error } = await supabase
      .from('events')
      .insert(row)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: rowToEvent(data), error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return { data: undefined, error: error.message };
    return { data: undefined, error: null };
  },

  async updateAttendees(id: string, userIds: string[]): Promise<ServiceResponse<void>> {
    await supabase.from('event_attendees').delete().eq('event_id', id);
    if (userIds.length > 0) {
      const rows = userIds.map(user_id => ({ event_id: id, user_id, name: '' }));
      const { error } = await supabase.from('event_attendees').insert(rows as any);
      if (error) return { data: undefined, error: error.message };
    }
    return { data: undefined, error: null };
  },

  async getById(id: string): Promise<ServiceResponse<NetworkEvent>> {
    const { data, error } = await supabase
      .from('events')
      .select('*, event_attendees(user_id)')
      .eq('id', id)
      .single();
    if (error) return { data: null, error: error.message };
    const attendees = (data?.event_attendees || []).map((a: any) => a.user_id);
    return { data: rowToEvent(data, attendees), error: null };
  },

  async update(id: string, updatedEvent: Partial<NetworkEvent>): Promise<ServiceResponse<NetworkEvent>> {
    const row = eventToRow(updatedEvent);
    const { data, error } = await supabase
      .from('events')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'Event not found' };
    return { data: rowToEvent(data), error: null };
  },
};