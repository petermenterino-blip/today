import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';

export const useBookingsQuery = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await bookingService.fetchAll();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.insert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
};
