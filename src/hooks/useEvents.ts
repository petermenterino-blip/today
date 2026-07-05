import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { NetworkEvent, EventSpeaker, EventComment, EventWaitlistEntry, EventFeedback, EventFile } from '../types';
import { eventService } from '../services/eventService';
import { useRealtimeData } from './useRealtimeData';
import { QK, STALE_TIMES } from '../constants/queryKeys';

export const useEvents = () => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'events', queryKey: [QK.events] },
  ]);

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: [QK.events],
    queryFn: async () => {
      const { data } = await eventService.fetchAll();
      return data || [];
    },
    staleTime: STALE_TIMES.slow,
  });

  const addEvent = useMutation({
    mutationFn: (event: Omit<NetworkEvent, 'id' | 'createdAt' | 'updatedAt'>) => eventService.insert(event),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NetworkEvent> }) => eventService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const duplicateEvent = useMutation({
    mutationFn: (id: string) => eventService.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const registerForEvent = useMutation({
    mutationFn: ({ eventId, userId, name, email }: { eventId: string; userId: string; name?: string; email?: string }) =>
      eventService.register(eventId, userId, name, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const unregisterFromEvent = useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      eventService.unregister(eventId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const joinWaitlist = useMutation({
    mutationFn: ({ eventId, userId, name, email }: { eventId: string; userId: string; name?: string; email?: string }) =>
      eventService.joinWaitlist(eventId, userId, name, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const leaveWaitlist = useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      eventService.leaveWaitlist(eventId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const promoteFromWaitlist = useMutation({
    mutationFn: ({ eventId, entryId, userId }: { eventId: string; entryId: string; userId: string }) =>
      eventService.promoteFromWaitlist(eventId, entryId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const markAttendance = useMutation({
    mutationFn: ({ eventId, userId, status, checkedIn }: { eventId: string; userId: string; status: 'attended' | 'absent' | 'left_early'; checkedIn?: boolean }) =>
      eventService.markAttendance(eventId, userId, status, checkedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const addSpeaker = useMutation({
    mutationFn: ({ eventId, speaker }: { eventId: string; speaker: Partial<EventSpeaker> }) =>
      eventService.addSpeaker(eventId, speaker),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const removeSpeaker = useMutation({
    mutationFn: (speakerId: string) => eventService.removeSpeaker(speakerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const addComment = useMutation({
    mutationFn: ({ eventId, userId, content, parentId, isAnnouncement }: { eventId: string; userId: string; content: string; parentId?: string; isAnnouncement?: boolean }) =>
      eventService.addComment(eventId, userId, content, parentId, isAnnouncement),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => eventService.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const submitFeedback = useMutation({
    mutationFn: ({ eventId, userId, rating, comment, suggestion, wouldRecommend }: {
      eventId: string; userId: string; rating: number; comment?: string; suggestion?: string; wouldRecommend?: boolean
    }) => eventService.submitFeedback(eventId, userId, rating, comment, suggestion, wouldRecommend),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const addFile = useMutation({
    mutationFn: ({ eventId, file }: { eventId: string; file: Partial<EventFile> }) =>
      eventService.addFile(eventId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const removeFile = useMutation({
    mutationFn: (fileId: string) => eventService.removeFile(fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const logActivity = useMutation({
    mutationFn: ({ eventId, userId, action, description, metadata }: { eventId: string; userId?: string; action: string; description?: string; metadata?: Record<string, any> }) =>
      eventService.logActivity(eventId, userId, action, description, metadata),
  });

  const archiveEvent = useMutation({
    mutationFn: (id: string) => eventService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const restoreEvent = useMutation({
    mutationFn: (id: string) => eventService.restore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK.events] }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QK.events] });
  }, [queryClient]);

  return {
    events, loading,
    addEvent: addEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    updateEvent: (id: string, updates: Partial<NetworkEvent>) => updateEvent.mutateAsync({ id, updates }),
    duplicateEvent: duplicateEvent.mutateAsync,
    registerForEvent: registerForEvent.mutateAsync,
    unregisterFromEvent: unregisterFromEvent.mutateAsync,
    joinWaitlist: joinWaitlist.mutateAsync,
    leaveWaitlist: leaveWaitlist.mutateAsync,
    promoteFromWaitlist: promoteFromWaitlist.mutateAsync,
    markAttendance: markAttendance.mutateAsync,
    addSpeaker: addSpeaker.mutateAsync,
    removeSpeaker: removeSpeaker.mutateAsync,
    addComment: addComment.mutateAsync,
    deleteComment: deleteComment.mutateAsync,
    submitFeedback: submitFeedback.mutateAsync,
    addFile: addFile.mutateAsync,
    removeFile: removeFile.mutateAsync,
    logActivity: logActivity.mutateAsync,
    archiveEvent: archiveEvent.mutateAsync,
    restoreEvent: restoreEvent.mutateAsync,
    isPending: addEvent.isPending || updateEvent.isPending || deleteEvent.isPending,
    refresh,
  };
};
