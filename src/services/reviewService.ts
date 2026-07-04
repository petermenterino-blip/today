import { supabase } from '../lib/supabase';
import { Review, ReviewHistory, ReviewStats, ReviewStatus } from '../interfaces';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError } from '../lib/errorHandler';
import { notificationStorage } from './notificationStorage';
import { timelineService } from './timelineService';
import { studentProgressService } from './studentProgressService';

const REVIEW_STATUS_FLOW: Record<ReviewStatus, ReviewStatus[]> = {
  draft: ['assigned', 'archived'],
  assigned: ['pending', 'submitted', 'archived'],
  pending: ['submitted', 'archived'],
  submitted: ['in_review', 'assigned', 'archived'],
  in_review: ['completed', 'submitted', 'archived'],
  completed: ['archived'],
  archived: [],
};

function fromDb(row: any): Review {
  return {
    id: row.id,
    student_id: row.student_id,
    mentor_id: row.mentor_id,
    program_id: row.program_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority || 'medium',
    due_date: row.due_date,
    rating: row.rating,
    feedback: row.feedback,
    mentor_notes: row.mentor_notes,
    mentor_response: row.mentor_response,
    student_response: row.student_response,
    tags: row.tags || [],
    estimated_review_time: row.estimated_review_time,
    completion_percentage: row.completion_percentage || 0,
    last_edited_at: row.last_edited_at,
    last_edited_by: row.last_edited_by,
    completed_at: row.completed_at,
    source_type: row.source_type,
    source_id: row.source_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    student_name: row.student?.name || row.student_name,
    student_email: row.student?.email || row.student_email,
    mentor_name: row.mentor?.name || row.mentor_name,
    program_name: row.program?.title || row.program_name,
  };
}

function historyFromDb(row: any): ReviewHistory {
  return {
    id: row.id,
    review_id: row.review_id,
    actor_id: row.actor_id,
    from_status: row.from_status,
    to_status: row.to_status,
    comment: row.comment,
    created_at: row.created_at,
    actor_name: row.actor?.name,
  };
}

export const reviewService = {
  isValidTransition(from: ReviewStatus, to: ReviewStatus): boolean {
    return REVIEW_STATUS_FLOW[from]?.includes(to) ?? false;
  },

  async getAll(mentorId?: string): Promise<{ data: Review[]; error: string | null }> {
    let query = supabase
      .from('reviews')
      .select('*, student:profiles!reviews_student_id_fkey(name, email), program:programs!reviews_program_id_fkey(title)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (mentorId) {
      query = query.eq('mentor_id', mentorId);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: interpretError(error) };
    return { data: (data || []).map(fromDb), error: null };
  },

  async getByStudentId(studentId: string): Promise<{ data: Review[]; error: string | null }> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, mentor:profiles!reviews_mentor_id_fkey(name), program:programs!reviews_program_id_fkey(title)')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: interpretError(error) };
    return { data: (data || []).map(fromDb), error: null };
  },

  async getByMentorId(mentorId: string): Promise<{ data: Review[]; error: string | null }> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, student:profiles!reviews_student_id_fkey(name, email), program:programs!reviews_program_id_fkey(title)')
      .eq('mentor_id', mentorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: interpretError(error) };
    return { data: (data || []).map(fromDb), error: null };
  },

  async getById(id: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, student:profiles!reviews_student_id_fkey(name, email), mentor:profiles!reviews_mentor_id_fkey(name), program:programs!reviews_program_id_fkey(title)')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return fromDb(data);
  },

  async create(review: {
    student_id: string;
    mentor_id: string;
    program_id?: string;
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
    tags?: string[];
    estimated_review_time?: number;
    source_type?: string;
    source_id?: string;
  }): Promise<{ data: Review | null; error: string | null }> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        student_id: review.student_id,
        mentor_id: review.mentor_id,
        program_id: review.program_id,
        title: review.title,
        description: review.description,
        priority: review.priority || 'medium',
        due_date: review.due_date,
        tags: review.tags || [],
        estimated_review_time: review.estimated_review_time,
        source_type: review.source_type,
        source_id: review.source_id,
        status: 'assigned',
      })
      .select()
      .single();
    if (error) return { data: null, error: interpretError(error) };

    const reviewData = fromDb(data);

    // Timeline event for student
    timelineService.create({
      student_id: review.student_id,
      type: 'review_assigned',
      title: 'Review Assigned',
      description: `New review assigned: "${review.title}"`,
    }).catch(() => {});

    // Notification for student
    notificationStorage.create({
      userId: review.student_id,
      title: 'Review Assigned',
      message: `You have a new review to complete: "${review.title}"`,
      type: 'review',
      link: '/student/reviews',
    }).catch(() => {});

    return { data: reviewData, error: null };
  },

  async updateStatus(
    id: string,
    newStatus: ReviewStatus,
    options?: { feedback?: string; rating?: number; mentor_response?: string; mentor_notes?: string; student_response?: string }
  ): Promise<{ data: Review | null; error: string | null }> {
    // Fetch current state (select only needed columns for performance)
    const { data: current, error: fetchError } = await supabase
      .from('reviews')
      .select('id, student_id, mentor_id, program_id, title, status, created_at')
      .eq('id', id)
      .single();
    if (fetchError || !current) return { data: null, error: 'Review not found' };
    if (!this.isValidTransition(current.status, newStatus)) {
      return { data: null, error: `Cannot transition from ${current.status} to ${newStatus}` };
    }

    const updates: Record<string, any> = { status: newStatus, last_edited_at: new Date().toISOString() };
    if (options?.feedback !== undefined) updates.feedback = options.feedback;
    if (options?.rating !== undefined) updates.rating = options.rating;
    if (options?.mentor_response !== undefined) updates.mentor_response = options.mentor_response;
    if (options?.mentor_notes !== undefined) updates.mentor_notes = options.mentor_notes;
    if (options?.student_response !== undefined) updates.student_response = options.student_response;

    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.completion_percentage = 100;
    }
    if (newStatus === 'submitted') {
      updates.completion_percentage = 50;
    }
    if (newStatus === 'in_review') {
      updates.completion_percentage = 75;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select('*, student:profiles!reviews_student_id_fkey(name, email), mentor:profiles!reviews_mentor_id_fkey(name), program:programs!reviews_program_id_fkey(title)')
      .single();
    if (error) return { data: null, error: interpretError(error) };

    const updated = fromDb(data);

    // Notifications & timeline based on status transition
    if (newStatus === 'submitted') {
      notificationStorage.create({
        userId: current.mentor_id,
        title: 'Review Submitted',
        message: `"${current.title}" has been submitted for your review`,
        type: 'review',
        link: '/mentor?tab=feedback',
      }).catch(() => {});
      timelineService.create({
        student_id: current.student_id,
        type: 'review_submitted',
        title: 'Review Submitted',
        description: `Review submitted: "${current.title}"`,
      }).catch(() => {});
    }

    if (newStatus === 'in_review') {
      notificationStorage.create({
        userId: current.student_id,
        title: 'Review In Progress',
        message: `Your mentor is reviewing "${current.title}"`,
        type: 'review',
        link: '/student/reviews',
      }).catch(() => {});
    }

    if (newStatus === 'completed') {
      notificationStorage.create({
        userId: current.student_id,
        title: 'Review Complete',
        message: `Your review "${current.title}" has been completed with feedback`,
        type: 'review',
        link: '/student/reviews',
      }).catch(() => {});

      timelineService.create({
        student_id: current.student_id,
        type: 'review_completed',
        title: 'Review Completed',
        description: `Review completed: "${current.title}"`,
      }).catch(() => {});

      if (current.program_id) {
        studentProgressService.getProgress(current.student_id, current.program_id).catch(() => {});
      }
    }

    if (newStatus === 'archived') {
      timelineService.create({
        student_id: current.student_id,
        type: 'review_archived',
        title: 'Review Archived',
        description: `Review archived: "${current.title}"`,
      }).catch(() => {});
    }

    return { data: updated, error: null };
  },

  async update(
    id: string,
    updates: Partial<Review>
  ): Promise<{ data: Review | null; error: string | null }> {
    const row: Record<string, any> = { last_edited_at: new Date().toISOString() };
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.priority !== undefined) row.priority = updates.priority;
    if (updates.due_date !== undefined) row.due_date = updates.due_date;
    if (updates.tags !== undefined) row.tags = updates.tags;
    if (updates.estimated_review_time !== undefined) row.estimated_review_time = updates.estimated_review_time;
    if (updates.completion_percentage !== undefined) row.completion_percentage = updates.completion_percentage;
    if (updates.mentor_notes !== undefined) row.mentor_notes = updates.mentor_notes;
    if (updates.student_response !== undefined) row.student_response = updates.student_response;

    const { data, error } = await supabase
      .from('reviews')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: interpretError(error) };
    return { data: fromDb(data), error: null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { error: interpretError(error) };
    return { error: null };
  },

  async hardDelete(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    if (error) return { error: interpretError(error) };
    return { error: null };
  },

  async archive(id: string): Promise<{ data: Review | null; error: string | null }> {
    return this.updateStatus(id, 'archived');
  },

  async getHistory(reviewId: string): Promise<ReviewHistory[]> {
    const { data, error } = await supabase
      .from('review_history')
      .select('*, actor:profiles!review_history_actor_id_fkey(name)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data || []).map(historyFromDb);
  },

  async getStats(mentorId: string): Promise<ReviewStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const baseQuery = supabase
      .from('reviews')
      .select('id, status, rating, created_at, completed_at', { count: 'exact' })
      .eq('mentor_id', mentorId)
      .is('deleted_at', null);

    const { count: total } = await baseQuery;
    const { data: completed, count: completedCount } = await supabase
      .from('reviews')
      .select('id, rating, created_at, completed_at', { count: 'exact' })
      .eq('mentor_id', mentorId)
      .eq('status', 'completed')
      .is('deleted_at', null);
    const { count: pendingCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .in('status', ['assigned', 'pending', 'submitted', 'in_review'])
      .is('deleted_at', null);
    const { count: weeklyCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .gte('created_at', weekAgo)
      .is('deleted_at', null);
    const { count: monthlyCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .gte('created_at', monthAgo)
      .is('deleted_at', null);

    const ratings = (completed || []).filter(r => r.rating).map(r => r.rating);

    let totalReviewTime = 0;
    let completedWithTime = 0;
    (completed || []).forEach(r => {
      if (r.completed_at && r.created_at) {
        totalReviewTime += new Date(r.completed_at).getTime() - new Date(r.created_at).getTime();
        completedWithTime++;
      }
    });

    return {
      total: total || 0,
      pending: pendingCount || 0,
      completed: completedCount || 0,
      average_rating: ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0,
      completion_rate: (total || 0) > 0 ? Math.round(((completedCount || 0) / (total || 0)) * 100) : 0,
      weekly_count: weeklyCount || 0,
      monthly_count: monthlyCount || 0,
      average_review_time: completedWithTime > 0 ? Math.round(totalReviewTime / completedWithTime / (1000 * 60 * 60 * 24)) : 0,
    };
  },

  async bulkAction(
    ids: string[],
    action: 'approve' | 'reject' | 'archive' | 'delete' | 'complete',
    options?: { feedback?: string }
  ): Promise<{ error: string | null }> {
    const errors: string[] = [];
    for (const id of ids) {
      if (action === 'delete') {
        const { error } = await this.hardDelete(id);
        if (error) errors.push(error);
      } else if (action === 'archive') {
        const { error } = await this.archive(id);
        if (error) errors.push(error);
      } else if (action === 'approve' || action === 'complete') {
        const { error } = await this.updateStatus(id, 'completed', options);
        if (error) errors.push(error);
      } else if (action === 'reject') {
        const { error } = await this.updateStatus(id, 'submitted', options);
        if (error) errors.push(error);
      }
    }
    return { error: errors.length > 0 ? errors.join('; ') : null };
  },
};
