import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { visitorBookingService, VisitorBooking } from '../services/visitorBookingService';
import { useRealtimeData } from './useRealtimeData';
import { QK } from '../constants/queryKeys';

export const useVisitorBookings = () => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'visitor_bookings', queryKey: [QK.visitorBookings] },
    { table: 'booking_notes', queryKey: [QK.visitorBookings] },
    { table: 'booking_timeline', queryKey: [QK.visitorBookings] },
  ]);

  const { data: bookings = [], isLoading: loading } = useQuery({
    queryKey: [QK.visitorBookings],
    queryFn: async () => {
      const result = await visitorBookingService.fetchAll();
      return result?.data?.data || [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const submitBooking = useMutation({
    mutationFn: (booking: Parameters<typeof visitorBookingService.submit>[0]) =>
      visitorBookingService.submit(booking),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const fetchBookings = useMutation({
    mutationFn: (params?: { search?: string; filters?: Record<string, any>; page?: number; pageSize?: number }) =>
      (visitorBookingService.fetchAll as any)(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const getBooking = useMutation({
    mutationFn: (id: string) => visitorBookingService.getById(id),
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<any> }) =>
      visitorBookingService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const updateBookingStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitorBooking['status'] }) =>
      visitorBookingService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const deleteBooking = useMutation({
    mutationFn: (id: string) => visitorBookingService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const assignMentor = useMutation({
    mutationFn: ({ bookingId, mentorId, mentorName }: { bookingId: string; mentorId: string; mentorName: string }) =>
      visitorBookingService.assignMentor(bookingId, mentorId, mentorName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const addNote = useMutation({
    mutationFn: ({ bookingId, note, createdBy }: { bookingId: string; note: string; createdBy: string }) =>
      visitorBookingService.addNote(bookingId, note, createdBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] }),
  });

  const getNotes = useMutation({
    mutationFn: (bookingId: string) => visitorBookingService.getNotes(bookingId),
  });

  const getTimeline = useMutation({
    mutationFn: (bookingId: string) => visitorBookingService.getTimeline(bookingId),
  });

  const getStats = useMutation({
    mutationFn: () => visitorBookingService.getStats(),
  });

  const convertToStudent = useMutation({
    mutationFn: (bookingId: string) => visitorBookingService.convertToStudent(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] });
      queryClient.invalidateQueries({ queryKey: [QK.studentList] });
    },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QK.visitorBookings] });
  }, [queryClient]);

  return {
    bookings, loading,
    submitBooking: submitBooking.mutateAsync,
    fetchBookings: fetchBookings.mutateAsync,
    getBooking: getBooking.mutateAsync,
    updateBooking: (id: string, updates: Partial<any>) => updateBooking.mutateAsync({ id, updates }),
    updateBookingStatus: ({ id, status }: { id: string; status: VisitorBooking['status'] }) =>
      updateBookingStatus.mutateAsync({ id, status }),
    deleteBooking: deleteBooking.mutateAsync,
    assignMentor: ({ bookingId, mentorId, mentorName }: { bookingId: string; mentorId: string; mentorName: string }) =>
      assignMentor.mutateAsync({ bookingId, mentorId, mentorName }),
    addNote: ({ bookingId, note, createdBy }: { bookingId: string; note: string; createdBy: string }) =>
      addNote.mutateAsync({ bookingId, note, createdBy }),
    getNotes: getNotes.mutateAsync,
    getTimeline: getTimeline.mutateAsync,
    getStats: getStats.mutateAsync,
    convertToStudent: convertToStudent.mutateAsync,
    isPending: submitBooking.isPending || updateBooking.isPending || deleteBooking.isPending,
    refresh,
  };
};
