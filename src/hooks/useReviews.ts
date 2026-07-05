import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { reviewService } from '../services/reviewService';
import { Review, ReviewPriority, ReviewStatus } from '../interfaces';
import { useRealtimeData } from './useRealtimeData';
import { useAuth } from '../context/AuthContext';

export function useReviews() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const role = user?.role;
  const userId = user?.id;

  const reviewsKey = role === 'mentor'
    ? ['reviews', 'mentor', userId]
    : ['reviews', 'student', userId];

  useRealtimeData([
    { table: 'reviews', queryKey: reviewsKey },
    { table: 'review_history', queryKey: reviewsKey },
  ]);

  const { data: reviews = [], isLoading: loading } = useQuery({
    queryKey: reviewsKey,
    queryFn: async () => {
      if (!userId) return [];
      const fn = role === 'mentor'
        ? reviewService.getByMentorId(userId)
        : reviewService.getByStudentId(userId);
      const { data } = await fn;
      return data || [];
    },
    enabled: !!userId && (role === 'mentor' || role === 'student'),
    staleTime: 5 * 60 * 1000,
  });

  const createReview = useMutation({
    mutationFn: (review: Parameters<typeof reviewService.create>[0]) => reviewService.create(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, options }: { id: string; status: ReviewStatus; options?: any }) =>
      reviewService.updateStatus(id, status, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const updateReview = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Review> }) => reviewService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => reviewService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const bulkAction = useMutation({
    mutationFn: ({ ids, action, options }: { ids: string[]; action: 'approve' | 'reject' | 'archive' | 'delete' | 'complete'; options?: { feedback?: string } }) =>
      reviewService.bulkAction(ids, action, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  }, [queryClient]);

  return {
    reviews,
    loading,
    createReview: createReview.mutateAsync,
    updateStatus: (id: string, status: ReviewStatus, options?: any) => updateStatus.mutateAsync({ id, status, options }),
    updateReview: (id: string, updates: Partial<Review>) => updateReview.mutateAsync({ id, updates }),
    deleteReview: deleteReview.mutateAsync,
    bulkAction: (ids: string[], action: 'approve' | 'reject' | 'archive' | 'delete' | 'complete', options?: { feedback?: string }) =>
      bulkAction.mutateAsync({ ids, action, options }),
    refresh,
  };
}

export function useReviewFilters(reviews: Review[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ReviewPriority | 'all'>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [mentorFilter, setMentorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'due_date' | 'priority'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const programOptions = useMemo(() => {
    const names = new Set(reviews.map(r => r.program_name).filter(Boolean));
    return Array.from(names).sort();
  }, [reviews]);

  const mentorOptions = useMemo(() => {
    const names = new Set(reviews.map(r => r.mentor_name).filter(Boolean));
    return Array.from(names).sort();
  }, [reviews]);

  const filtered = useMemo(() => {
    let result = [...reviews];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.student_name || '').toLowerCase().includes(q) ||
        (r.student_email || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.program_name || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(r => r.priority === priorityFilter);
    }

    if (programFilter !== 'all') {
      result = result.filter(r => r.program_name === programFilter);
    }

    if (mentorFilter !== 'all') {
      result = result.filter(r => r.mentor_name === mentorFilter);
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'due_date':
        result.sort((a, b) => {
          const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return da - db;
        });
        break;
      case 'priority': {
        const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        result.sort((a, b) => (p[a.priority] || 2) - (p[b.priority] || 2));
        break;
      }
    }

    return result;
  }, [reviews, searchQuery, statusFilter, priorityFilter, programFilter, mentorFilter, sortBy]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  return {
    filtered: paginated,
    allFiltered: filtered,
    totalPages,
    page,
    setPage,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    programFilter, setProgramFilter,
    programOptions,
    mentorFilter, setMentorFilter,
    mentorOptions,
    sortBy, setSortBy,
  };
}
