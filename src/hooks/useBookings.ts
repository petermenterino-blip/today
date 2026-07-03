import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';
import { useRealtimeData } from './useRealtimeData';

export const useBookings = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'bookings', queryKey: ['bookings'] }]);

  const { data: bookings = [], isLoading: loading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await bookingService.fetchAll();
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addBooking = useMutation({
    mutationFn: (booking: Omit<Booking, 'id'>) => bookingService.insert(booking),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    onError: (err) => console.error('Booking insert failed:', err),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  }, [queryClient]);

  return { 
    bookings, 
    loading, 
    error,
    addBooking: addBooking.mutateAsync,
    refresh,
  };
};
