import { supabase } from '../lib/supabase';
import { NetworkEvent, ServiceResponse, EventSpeaker, EventWaitlistEntry, EventComment, EventActivity, EventFeedback, EventFile } from '../types';
import { handleError } from '../lib/serviceHelper';

const EVENT_FIELDS = `
  *,
  event_attendees(user_id, name, email, registration_status, attendance_status, waitlist_position, checked_in, feedback_submitted, bookmarked, registered_at),
  event_speakers(*),
  event_waitlist(*),
  event_comments(*),
  event_activity(*),
  event_feedbacks(*),
  event_files(*)
`;

function rowToEvent(row: any): NetworkEvent {
  const e: any = { id: row.id, attendees: [] };
  for (const [col, val] of Object.entries(row)) {
    if (['id', 'event_attendees', 'event_speakers', 'event_waitlist', 'event_comments', 'event_activity', 'event_feedbacks', 'event_files'].includes(col)) continue;
    const key = SNAKE_TO_CAMEL[col] || col;
    e[key] = val;
  }
  e.attendees = (row.event_attendees || []).map((a: any) => a.user_id);
  e.registrations = (row.event_attendees || []).map((a: any) => ({
    userId: a.user_id,
    name: a.name || '',
    email: a.email || '',
    program: a.program || '',
    registrationDate: a.registered_at || '',
    status: a.registration_status || 'confirmed',
    attendanceStatus: a.attendance_status || 'none',
    waitlistPosition: a.waitlist_position,
    checkedIn: a.checked_in || false,
    checkedInAt: a.checked_in_at,
    feedbackSubmitted: a.feedback_submitted || false,
    bookmarked: a.bookmarked || false,
  }));
  e.speakers = (row.event_speakers || []).map(speakerRowToSpeaker);
  e.waitlist = (row.event_waitlist || []).map(waitlistRowToEntry);
  e.comments = (row.event_comments || []).map(commentRowToComment);
  e.activityLog = (row.event_activity || []).map(activityRowToActivity);
  e.feedbacks = (row.event_feedbacks || []).map(feedbackRowToFeedback);
  e.files = (row.event_files || []).map(fileRowToFile);
  return e as NetworkEvent;
}

function speakerRowToSpeaker(row: any): EventSpeaker {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    title: row.title,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    linkedinUrl: row.linkedin_url,
    company: row.company,
    sortOrder: row.sort_order,
  };
}

function waitlistRowToEntry(row: any): EventWaitlistEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    promotedAt: row.promoted_at,
  };
}

function commentRowToComment(row: any): EventComment {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    isAnnouncement: row.is_announcement || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function activityRowToActivity(row: any): EventActivity {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    action: row.action,
    description: row.description,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

function feedbackRowToFeedback(row: any): EventFeedback {
  return {
    id: row.id,
    rating: row.rating,
    studentName: row.student_name || '',
    comment: row.comment || '',
    suggestion: row.suggestion,
    date: row.created_at,
    wouldRecommend: row.would_recommend,
    ratingBreakdown: row.rating_breakdown,
  };
}

function fileRowToFile(row: any): EventFile {
  return {
    id: row.id,
    name: row.name || '',
    type: row.type || 'resource',
    url: row.url,
    size: row.size,
    uploadedAt: row.uploaded_at,
  };
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  endTime: 'end_time', meetingLink: 'meeting_link', coverImage: 'cover_image',
  registrationDeadline: 'registration_deadline', waitlistLimit: 'waitlist_limit',
  resourceFiles: 'resource_files', eventColor: 'event_color', eventType: 'event_type',
  programId: 'program_id', meetingPlatform: 'meeting_platform', formIds: 'form_ids',
  allowRegistrationApproval: 'allow_registration_approval', createdAt: 'created_at',
  updatedAt: 'updated_at', createdBy: 'created_by',
};

const SNAKE_TO_CAMEL: Record<string, string> = {
  end_time: 'endTime', meeting_link: 'meetingLink', cover_image: 'coverImage',
  registration_deadline: 'registrationDeadline', waitlist_limit: 'waitlistLimit',
  resource_files: 'resourceFiles', event_color: 'eventColor', event_type: 'eventType',
  program_id: 'programId', meeting_platform: 'meetingPlatform', form_ids: 'formIds',
  allow_registration_approval: 'allowRegistrationApproval', created_at: 'createdAt',
  updated_at: 'updatedAt', created_by: 'createdBy',
};

function eventToRow(e: Partial<NetworkEvent>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(e)) {
    if (val === undefined) continue;
    const col = CAMEL_TO_SNAKE[key] || key;
    row[col] = val instanceof Object && !Array.isArray(val) && !(typeof val === 'string') ? JSON.stringify(val) : val;
  }
  return row;
}

export const eventService = {
  async fetchAll(): Promise<ServiceResponse<NetworkEvent[]>> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .order('date', { ascending: false });
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEvent), error: null };
  },

  async fetchUpcoming(): Promise<ServiceResponse<NetworkEvent[]>> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .gte('date', today)
      .in('status', ['published', 'draft'])
      .order('date');
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEvent), error: null };
  },

  async fetchLive(): Promise<ServiceResponse<NetworkEvent[]>> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .eq('date', today)
      .eq('status', 'published')
      .order('time');
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEvent), error: null };
  },

  async fetchByProgram(programId: string): Promise<ServiceResponse<NetworkEvent[]>> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .eq('program_id', programId)
      .order('date');
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToEvent), error: null };
  },

  async insert(event: Omit<NetworkEvent, 'id'>): Promise<ServiceResponse<NetworkEvent>> {
    const row = eventToRow(event as any);
    const { data, error } = await supabase
      .from('events')
      .insert(row)
      .select(EVENT_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToEvent(data), error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async getById(id: string): Promise<ServiceResponse<NetworkEvent>> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .eq('id', id)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToEvent(data), error: null };
  },

  async update(id: string, updates: Partial<NetworkEvent>): Promise<ServiceResponse<NetworkEvent>> {
    const row = eventToRow(updates);
    const { data, error } = await supabase
      .from('events')
      .update(row)
      .eq('id', id)
      .select(EVENT_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Event not found' };
    return { data: rowToEvent(data), error: null };
  },

  async duplicate(id: string): Promise<ServiceResponse<NetworkEvent>> {
    const { data: original, error } = await this.getById(id);
    if (error || !original) return { data: null, error: error || 'Original not found' };
    const { title, description, eventType, date, time, endTime, timezone, location, meetingLink, venue, image, capacity, registrationDeadline, speaker, visibility, tags, duration, waitlistLimit, resourceFiles, requirements, eventColor, programId, meetingPlatform, agenda, reminderSettings, formIds, allowRegistrationApproval, notes } = original;
    return this.insert({
      title: `${title} (Copy)`, description, date, time, endTime, timezone, location, meetingLink, venue, image, capacity, registrationDeadline, speaker, visibility, status: 'draft', tags, attendees: [], duration, waitlistLimit, resourceFiles, requirements, eventColor, programId, eventType, meetingPlatform, agenda: agenda || [], reminderSettings, formIds, allowRegistrationApproval, notes, coverImage: original.coverImage,
    } as any);
  },

  async updateAttendees(id: string, userIds: string[]): Promise<ServiceResponse<void>> {
    await supabase.from('event_attendees').delete().eq('event_id', id);
    if (userIds.length > 0) {
      const rows = userIds.map(user_id => ({ event_id: id, user_id }));
      const { error } = await supabase.from('event_attendees').insert(rows as any);
      if (error) return { data: undefined, error: handleError(error).error };
    }
    return { data: undefined, error: null };
  },

  // ── Registration ──
  async register(eventId: string, userId: string, name?: string, email?: string): Promise<ServiceResponse<void>> {
    const { data: existing } = await supabase.from('event_attendees').select('id').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
    if (existing) return { data: undefined, error: null };
    const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId, name: name || '', email: email || '', registration_status: 'confirmed' });
    if (error) return { data: undefined, error: handleError(error).error };
    await this.logActivity(eventId, userId, 'registration', `User registered for event`);
    return { data: undefined, error: null };
  },

  async unregister(eventId: string, userId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', userId);
    if (error) return { data: undefined, error: handleError(error).error };
    await supabase.from('event_waitlist').delete().eq('event_id', eventId).eq('user_id', userId);
    await this.logActivity(eventId, userId, 'cancellation', `User cancelled registration`);
    return { data: undefined, error: null };
  },

  async getRegistration(eventId: string, userId: string): Promise<boolean> {
    const { data } = await supabase.from('event_attendees').select('id').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
    return !!data;
  },

  async getAttendees(eventId: string): Promise<string[]> {
    const { data } = await supabase.from('event_attendees').select('user_id').eq('event_id', eventId);
    return (data || []).map(a => a.user_id);
  },

  async markAttendance(eventId: string, userId: string, status: 'attended' | 'absent' | 'left_early', checkedIn?: boolean): Promise<ServiceResponse<void>> {
    const updates: Record<string, any> = { attendance_status: status };
    if (checkedIn) { updates.checked_in = true; updates.checked_in_at = new Date().toISOString(); }
    if (status === 'left_early') updates.left_early = true;
    const { error } = await supabase.from('event_attendees').update(updates).eq('event_id', eventId).eq('user_id', userId);
    if (error) return { data: undefined, error: handleError(error).error };
    await this.logActivity(eventId, userId, 'attendance', `Attendance marked: ${status}`);
    return { data: undefined, error: null };
  },

  // ── Waitlist ──
  async joinWaitlist(eventId: string, userId: string, name?: string, email?: string): Promise<ServiceResponse<EventWaitlistEntry>> {
    const { data: existing } = await supabase.from('event_waitlist').select('id').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
    if (existing) return { data: null, error: 'Already on waitlist' };
    const { data: maxPos } = await supabase.from('event_waitlist').select('position').eq('event_id', eventId).order('position', { ascending: false }).limit(1).maybeSingle();
    const position = (maxPos?.position || 0) + 1;
    const { data, error } = await supabase.from('event_waitlist').insert({ event_id: eventId, user_id: userId, name: name || '', email: email || '', position, status: 'waiting' }).select().single();
    if (error) return { data: null, error: handleError(error).error };
    await this.logActivity(eventId, userId, 'waitlist_join', `User joined waitlist at position ${position}`);
    return { data: waitlistRowToEntry(data), error: null };
  },

  async leaveWaitlist(eventId: string, userId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('event_waitlist').update({ status: 'cancelled' }).eq('event_id', eventId).eq('user_id', userId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async promoteFromWaitlist(eventId: string, entryId: string, userId: string): Promise<ServiceResponse<void>> {
    await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId, registration_status: 'confirmed' });
    await supabase.from('event_waitlist').update({ status: 'promoted', promoted_at: new Date().toISOString() }).eq('id', entryId);
    await this.logActivity(eventId, userId, 'waitlist_promoted', `User promoted from waitlist`);
    return { data: undefined, error: null };
  },

  // ── Speakers ──
  async addSpeaker(eventId: string, speaker: Partial<EventSpeaker>): Promise<ServiceResponse<EventSpeaker>> {
    const { data, error } = await supabase.from('event_speakers').insert({ event_id: eventId, name: speaker.name, title: speaker.title, bio: speaker.bio, avatar_url: speaker.avatarUrl, linkedin_url: speaker.linkedinUrl, company: speaker.company, sort_order: speaker.sortOrder || 0 }).select().single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: speakerRowToSpeaker(data), error: null };
  },

  async removeSpeaker(speakerId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('event_speakers').delete().eq('id', speakerId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  // ── Comments ──
  async addComment(eventId: string, userId: string, content: string, parentId?: string, isAnnouncement?: boolean): Promise<ServiceResponse<EventComment>> {
    const { data, error } = await supabase.from('event_comments').insert({ event_id: eventId, user_id: userId, content: content, parent_id: parentId || null, is_announcement: isAnnouncement || false }).select().single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: commentRowToComment(data), error: null };
  },

  async deleteComment(commentId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('event_comments').delete().eq('id', commentId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  // ── Activity Log ──
  async logActivity(eventId: string, userId: string | undefined, action: string, description?: string, metadata?: Record<string, any>): Promise<void> {
    await supabase.from('event_activity').insert({ event_id: eventId, user_id: userId || null, action, description: description || '', metadata: metadata || {} }).maybeSingle();
  },

  async getActivity(eventId: string): Promise<EventActivity[]> {
    const { data } = await supabase.from('event_activity').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    return (data || []).map(activityRowToActivity);
  },

  // ── Files ──
  async addFile(eventId: string, file: Partial<EventFile>): Promise<ServiceResponse<EventFile>> {
    const { data, error } = await supabase.from('event_files').insert({ event_id: eventId, name: file.name, type: file.type || 'resource', url: file.url, size: file.size || null }).select().single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: fileRowToFile(data), error: null };
  },

  async removeFile(fileId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('event_files').delete().eq('id', fileId);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  // ── Feedback ──
  async submitFeedback(eventId: string, userId: string, rating: number, comment?: string, suggestion?: string, wouldRecommend?: boolean): Promise<ServiceResponse<EventFeedback>> {
    const { data, error } = await supabase.from('event_feedbacks').insert({ event_id: eventId, user_id: userId, rating, comment: comment || '', suggestion: suggestion || '', would_recommend: wouldRecommend }).select().single();
    if (error) return { data: null, error: handleError(error).error };
    await supabase.from('event_attendees').update({ feedback_submitted: true }).eq('event_id', eventId).eq('user_id', userId);
    await this.logActivity(eventId, userId, 'feedback', `User submitted feedback (rating: ${rating})`);
    return { data: feedbackRowToFeedback(data), error: null };
  },

  // ── Export ──
  async exportAttendees(eventId: string): Promise<ServiceResponse<any[]>> {
    const { data, error } = await supabase.from('event_attendees').select('*').eq('event_id', eventId);
    if (error) return { data: null, error: handleError(error).error };
    return { data: data || [], error: null };
  },

  // ── Archive / Restore ──
  async archive(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('events').update({ archived: true }).eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async restore(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from('events').update({ archived: false }).eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },
};
