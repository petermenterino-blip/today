import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventRsvpService } from '../services/eventRsvpService';

export const useEventRsvp = (eventId: string, userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: isRegistered = false, isLoading: checking } = useQuery({
    queryKey: ['event-rsvp', eventId, userId],
    queryFn: () => eventRsvpService.getRegistration(eventId, userId!),
    enabled: !!userId && !!eventId,
    staleTime: 5 * 60 * 1000,
  });

  const register = useMutation({
    mutationFn: () => eventRsvpService.register(eventId, userId!, ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', eventId, userId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const unregister = useMutation({
    mutationFn: () => eventRsvpService.unregister(eventId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', eventId, userId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    isRegistered,
    checking,
    register: register.mutateAsync,
    unregister: unregister.mutateAsync,
    registering: register.isPending,
    unregistering: unregister.isPending,
  };
};
