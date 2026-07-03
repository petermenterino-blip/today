import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NetworkEvent } from '../types';
import { eventService } from '../services/eventService';
import { useRealtimeData } from './useRealtimeData';

export const useEvents = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'events', queryKey: ['events'] }]);

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await eventService.fetchAll();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addEvent = useMutation({
    mutationFn: (event: Omit<NetworkEvent, 'id' | 'created_at'>) => eventService.insert(event),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const attendEvent = useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { data: event } = await eventService.getById(eventId);
      if (event) {
        const attendees = event.attendees || [];
        if (!attendees.includes(userId)) {
          await eventService.updateAttendees(eventId, [...attendees, userId]);
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NetworkEvent> }) => eventService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  return { 
    events, 
    loading, 
    addEvent: addEvent.mutateAsync, 
    deleteEvent: deleteEvent.mutateAsync, 
    attendEvent: (eventId: string, userId: string) => attendEvent.mutateAsync({ eventId, userId }),
    updateEvent: (id: string, updates: Partial<NetworkEvent>) => updateEvent.mutateAsync({ id, updates }),
    refresh: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  };
};
