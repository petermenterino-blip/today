import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';

export const useEventsQuery = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await eventService.fetchAll();
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });
};

export const useAddEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventService.insert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useAttendEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => {
      return eventService.getById(eventId).then(async ({ data: event }) => {
        if (event) {
          const attendees = event.attendees || [];
          if (!attendees.includes(userId)) {
            await eventService.updateAttendees(eventId, [...attendees, userId]);
          }
        }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
};
