import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { STALE_TIMES } from '../constants/queryKeys';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';
import { useRealtimeData } from './useRealtimeData';
import { useAuth } from '../context/AuthContext';

export const useBookings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useRealtimeData([{ table: 'bookings', queryKey: ['bookings'] }]);

  const { data: bookings = [], isLoading: loading, error } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await bookingService.fetchAll(user?.id);
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.normal,
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
