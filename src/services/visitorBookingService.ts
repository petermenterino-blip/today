import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';
import { notify } from './notificationService';
import { edgeFunctionService } from './edgeFunctionService';

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export interface VisitorBooking {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  company?: string;
  studentProfessional?: string;
  callType: 'intro' | 'rapid';
  preferredMentor?: string;
  programOfInterest?: string;
  meetingType?: 'phone' | 'video' | 'in_person';
  date: string;
  time: string;
  timezone?: string;
  message?: string;
  sourcePage?: string;
  status: 'new' | 'contacted' | 'awaiting_confirmation' | 'scheduled' | 'completed' | 'cancelled' | 'rejected' | 'no_response';
  priority: 'low' | 'medium' | 'high';
  assignedMentorId?: string;
  assignedMentorName?: string;
  internalNotes?: string;
  notes?: string;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    newCount: number;
    contactedCount: number;
    awaitingCount: number;
    scheduledCount: number;
    completedCount: number;
    cancelledCount: number;
    rejectedCount: number;
    noResponseCount: number;
    totalBookings: number;
    todayCount: number;
    thisWeekCount: number;
    thisMonthCount: number;
    conversionRate: number;
  };
}

export interface BookingNote {
  id: string;
  bookingId: string;
  mentorId?: string;
  content: string;
  createdAt: string;
}

export interface BookingTimelineEntry {
  id: string;
  bookingId: string;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  visitorName: 'visitor_name',
  visitorEmail: 'visitor_email',
  visitorPhone: 'visitor_phone',
  studentProfessional: 'student_professional',
  callType: 'call_type',
  preferredMentor: 'preferred_mentor',
  programOfInterest: 'program_of_interest',
  meetingType: 'meeting_type',
  sourcePage: 'source_page',
  assignedMentorId: 'assigned_mentor_id',
  assignedMentorName: 'assigned_mentor_name',
  internalNotes: 'internal_notes',
  deletedAt: 'deleted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  bookingId: 'booking_id',
  mentorId: 'mentor_id',
  createdBy: 'created_by',
};

const SNAKE_TO_CAMEL: Record<string, string> = {
  visitor_name: 'visitorName',
  visitor_email: 'visitorEmail',
  visitor_phone: 'visitorPhone',
  student_professional: 'studentProfessional',
  call_type: 'callType',
  preferred_mentor: 'preferredMentor',
  program_of_interest: 'programOfInterest',
  meeting_type: 'meetingType',
  source_page: 'sourcePage',
  assigned_mentor_id: 'assignedMentorId',
  assigned_mentor_name: 'assignedMentorName',
  internal_notes: 'internalNotes',
  deleted_at: 'deletedAt',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  booking_id: 'bookingId',
  mentor_id: 'mentorId',
  created_by: 'createdBy',
};

function rowToVisitorBooking(row: any): VisitorBooking {
  const b: any = {};
  for (const [col, val] of Object.entries(row)) {
    if (col === 'stats') {
      b.stats = val;
      continue;
    }
    const key = SNAKE_TO_CAMEL[col] || col;
    b[key] = val;
  }
  return b as VisitorBooking;
}

function bookingToRow(b: Partial<VisitorBooking>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(b)) {
    if (val === undefined) continue;
    if (key === 'stats') continue;
    const col = CAMEL_TO_SNAKE[key] || key;
    row[col] = val;
  }
  return row;
}

function rowToBookingNote(row: any): BookingNote {
  return {
    id: row.id,
    bookingId: row.booking_id,
    mentorId: row.mentor_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

function rowToTimelineEntry(row: any): BookingTimelineEntry {
  return {
    id: row.id,
    bookingId: row.booking_id,
    action: row.action,
    description: row.description,
    metadata: row.metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export const visitorBookingService = {
  async submit(booking: Omit<VisitorBooking, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'status' | 'stats'>): Promise<ServiceResponse<VisitorBooking>> {
    try {
      const row = bookingToRow(booking as any);
      row.status = 'new';
      row.priority = booking.priority || 'medium';
      const { data, error } = await supabase
        .from('visitor_bookings')
        .insert(row)
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };
      const created = rowToVisitorBooking(data);

      const { error: tlError } = await supabase.from('booking_timeline').insert({
        booking_id: created.id,
        action: 'booking_created',
        description: `Booking created by ${created.visitorName}`,
        metadata: { visitorEmail: created.visitorEmail, callType: created.callType },
      });
      if (tlError) console.warn('[visitorBookingService] timeline insert failed:', tlError.message);

      edgeFunctionService.sendPublicEmail(
        created.visitorEmail,
        'Booking Confirmed — Mentorino',
        `<h1>Thanks, ${escHtml(created.visitorName)}!</h1><p>Your ${created.callType === 'rapid' ? 'Rapid Response' : 'Intro'} call has been booked for <strong>${escHtml(created.date)}</strong> at <strong>${escHtml(created.time)}</strong>.</p><p>We'll be in touch soon to confirm the details.</p><p>Best,<br/>The Mentorino Team</p>`
      ).catch(() => {});

      supabase.from('profiles').select('id').eq('role', 'mentor').eq('status', 'active').then(({ data: mentors }) => {
        if (mentors) {
          for (const m of mentors) {
            notify.bookingConfirmed(created.id, m.id, created.date, created.time).catch(() => {});
          }
        }
      });

      return { data: created, error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async fetchAll(params?: {
    status?: string;
    priority?: string;
    assignedMentorId?: string;
    programOfInterest?: string;
    meetingType?: string;
    sourcePage?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<ServiceResponse<{ data: VisitorBooking[]; total: number; stats: VisitorBooking['stats'] }>> {
    try {
      let query = supabase.from('visitor_bookings').select('*', { count: 'exact' });

      if (params?.status) query = query.eq('status', params.status);
      if (params?.priority) query = query.eq('priority', params.priority);
      if (params?.assignedMentorId) query = query.eq('assigned_mentor_id', params.assignedMentorId);
      if (params?.programOfInterest) query = query.eq('program_of_interest', params.programOfInterest);
      if (params?.meetingType) query = query.eq('meeting_type', params.meetingType);
      if (params?.sourcePage) query = query.eq('source_page', params.sourcePage);

      if (params?.search) {
        const s = `%${params.search}%`;
        query = query.or(`visitor_name.ilike.${s},visitor_email.ilike.${s},visitor_phone.ilike.${s},company.ilike.${s},notes.ilike.${s},internal_notes.ilike.${s}`);
      }

      query = query.is('deleted_at', null);

      const sortCol = params?.sortBy ? (CAMEL_TO_SNAKE[params.sortBy] || params.sortBy) : 'created_at';
      const sortOrd = params?.sortOrder || 'desc';
      query = query.order(sortCol, { ascending: sortOrd === 'asc' });

      if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

      const { data, error, count } = await query;
      if (error) return { data: null, error: handleError(error).error };

      const bookings = (data || []).map(rowToVisitorBooking);

      const stats = await this.getStats();

      return { data: { data: bookings, total: count || 0, stats: stats.data || undefined as any }, error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async getById(id: string): Promise<ServiceResponse<VisitorBooking>> {
    try {
      const { data, error } = await supabase
        .from('visitor_bookings')
        .select('id,name,email,phone,date,time,status,service_type,message,assigned_mentor_id,assigned_mentor_name,created_at,updated_at,deleted_at,metadata')
        .eq('id', id)
        .single();
      if (error) return { data: null, error: handleError(error).error };
      return { data: rowToVisitorBooking(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async update(id: string, updates: Partial<VisitorBooking>): Promise<ServiceResponse<VisitorBooking>> {
    try {
      const existing = await this.getById(id);
      if (existing.error || !existing.data) return { data: null, error: existing.error || 'Booking not found' };

      const row = bookingToRow(updates);
      row.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('visitor_bookings')
        .update(row)
        .eq('id', id)
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };

      const timelineMeta: Record<string, any> = {};
      if (updates.status && updates.status !== existing.data.status) {
        timelineMeta.oldStatus = existing.data.status;
        timelineMeta.newStatus = updates.status;
        if (existing.data.assignedMentorId) {
          notify.bookingConfirmed(id, existing.data.assignedMentorId, existing.data.date, existing.data.time).catch(() => {});
        }
      }
      await supabase.from('booking_timeline').insert({
        booking_id: id,
        action: 'booking_updated',
        description: `Booking updated`,
        metadata: Object.keys(timelineMeta).length > 0 ? timelineMeta : null,
      });

      return { data: rowToVisitorBooking(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async updateStatus(id: string, status: VisitorBooking['status']): Promise<ServiceResponse<VisitorBooking>> {
    try {
      const existing = await this.getById(id);
      if (existing.error || !existing.data) return { data: null, error: existing.error || 'Booking not found' };

      const { data, error } = await supabase
        .from('visitor_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };

      await supabase.from('booking_timeline').insert({
        booking_id: id,
        action: 'status_changed',
        description: `Status changed from ${existing.data.status} to ${status}`,
        metadata: { oldStatus: existing.data.status, newStatus: status },
      });

      return { data: rowToVisitorBooking(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('visitor_bookings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { data: undefined, error: handleError(error).error };
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: handleError(err).error };
    }
  },

  async assignMentor(id: string, mentorId: string, mentorName: string): Promise<ServiceResponse<VisitorBooking>> {
    try {
      const { data, error } = await supabase
        .from('visitor_bookings')
        .update({ assigned_mentor_id: mentorId, assigned_mentor_name: mentorName, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };

      await supabase.from('booking_timeline').insert({
        booking_id: id,
        action: 'mentor_assigned',
        description: `Assigned to mentor ${mentorName}`,
        metadata: { mentorId, mentorName },
      });

      return { data: rowToVisitorBooking(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async addNote(bookingId: string, mentorId: string | undefined, content: string): Promise<ServiceResponse<BookingNote>> {
    try {
      const { data, error } = await supabase
        .from('booking_notes')
        .insert({ booking_id: bookingId, mentor_id: mentorId || null, content })
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };

      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        action: 'note_added',
        description: `Note added`,
      });

      return { data: rowToBookingNote(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async getNotes(bookingId: string): Promise<ServiceResponse<BookingNote[]>> {
    try {
      const { data, error } = await supabase
        .from('booking_notes')
        .select('id,booking_id,mentor_id,content,created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });
      if (error) return { data: null, error: handleError(error).error };
      return { data: (data || []).map(rowToBookingNote), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async getTimeline(bookingId: string): Promise<ServiceResponse<BookingTimelineEntry[]>> {
    try {
      const { data, error } = await supabase
        .from('booking_timeline')
        .select('id,booking_id,action,description,metadata,created_by,created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (error) return { data: null, error: handleError(error).error };
      return { data: (data || []).map(rowToTimelineEntry), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async addTimelineEntry(bookingId: string, action: string, description?: string, metadata?: Record<string, any>, createdBy?: string): Promise<ServiceResponse<BookingTimelineEntry>> {
    try {
      const { data, error } = await supabase
        .from('booking_timeline')
        .insert({ booking_id: bookingId, action, description: description || null, metadata: metadata || null, created_by: createdBy || null })
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };
      return { data: rowToTimelineEntry(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async getStats(): Promise<ServiceResponse<VisitorBooking['stats']>> {
    try {
      const { data, error } = await supabase.rpc('get_booking_stats');
      if (error) return { data: null, error: handleError(error).error };
      return { data: data as VisitorBooking['stats'], error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },

  async convertToStudent(bookingId: string): Promise<ServiceResponse<VisitorBooking>> {
    try {
      const existing = await this.getById(bookingId);
      if (existing.error || !existing.data) return { data: null, error: existing.error || 'Booking not found' };

      const { visitorName, visitorEmail, programOfInterest } = existing.data;

      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', visitorEmail)
        .maybeSingle();

      let studentId: string;
      if (existingStudent) {
        studentId = existingStudent.id;
      } else {
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({ name: visitorName, email: visitorEmail })
          .select()
          .single();
        if (createError) return { data: null, error: handleError(createError).error };
        studentId = newStudent.id;
      }

      if (programOfInterest) {
        await supabase.from('enrollments').insert({
          student_id: studentId,
          program_id: programOfInterest,
          enrolled_at: new Date().toISOString(),
        }).maybeSingle();
      }

      const { data, error } = await supabase
        .from('visitor_bookings')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();
      if (error) return { data: null, error: handleError(error).error };

      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        action: 'converted_to_student',
        description: `Visitor converted to student (ID: ${studentId})`,
        metadata: { studentId, visitorEmail },
      });

      return { data: rowToVisitorBooking(data), error: null };
    } catch (err: any) {
      return { data: null, error: handleError(err).error };
    }
  },
};
