import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../services/messageService';
import { useRealtimeData } from './useRealtimeData';
import type { Message, Conversation } from '../types/messaging';

export const useMessaging = (userId: string, role: 'student' | 'mentor', conversationId?: string) => {
  const queryClient = useQueryClient();

  useRealtimeData([
    { table: 'conversations', queryKey: ['conversations'] },
    { table: 'messages', queryKey: ['messages'] },
  ]);

  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', userId, role],
    queryFn: () => messageService.getConversations(userId, role),
    staleTime: 5 * 60 * 1000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msg: Omit<Message, 'id' | 'timestamp' | 'status'>) =>
      messageService.sendMessage(msg),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: string) => messageService.markAsRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const pinConversationMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      messageService.pinConversation(id, pinned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const archiveConversationMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      messageService.archiveConversation(id, archived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => messageService.deleteConversation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const createConversationMutation = useMutation({
    mutationFn: ({ studentId, studentName }: { studentId: string; studentName: string }) =>
      messageService.createConversation(studentId, studentName, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const createGroupMutation = useMutation({
    mutationFn: ({ name, participantIds, description }: { name: string; participantIds: string[]; description?: string }) =>
      messageService.createGroup(name, userId, participantIds, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const updateGroupParticipantsMutation = useMutation({
    mutationFn: ({ groupId, participantIds }: { groupId: string; participantIds: string[] }) =>
      messageService.updateGroupParticipants(groupId, participantIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return {
    conversations,
    conversationsLoading,
    messages,
    messagesLoading,
    refetchConversations,
    sendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'status'>) => sendMessageMutation.mutateAsync(msg),
    markAsRead: (conversationId: string) => markAsReadMutation.mutateAsync(conversationId),
    pinConversation: (id: string, pinned: boolean) => pinConversationMutation.mutateAsync({ id, pinned }),
    archiveConversation: (id: string, archived: boolean) => archiveConversationMutation.mutateAsync({ id, archived }),
    deleteConversation: (id: string) => deleteConversationMutation.mutateAsync(id),
    createConversation: (studentId: string, studentName: string) => createConversationMutation.mutateAsync({ studentId, studentName }),
    createGroup: (name: string, participantIds: string[], description?: string) => createGroupMutation.mutateAsync({ name, participantIds, description }),
    updateGroupParticipants: (groupId: string, participantIds: string[]) => updateGroupParticipantsMutation.mutateAsync({ groupId, participantIds }),
  };
};
