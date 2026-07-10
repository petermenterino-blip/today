import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { notificationStorage } from '../services/notificationStorage';
import { useRealtimeData } from './useRealtimeData';
import { Notification as NotificationType } from '../interfaces';

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  useRealtimeData([{
    table: 'notifications',
    queryKey: ['notifications'],
    ...(userId ? { filter: { column: 'user_id', value: userId } } : {}),
  }]);

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['notifications', userId].filter(Boolean),
    queryFn: () => userId ? notificationStorage.getByUserId(userId) : notificationStorage.getAll(),
    staleTime: STALE_TIMES.frequent,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await notificationStorage.update(id, { read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications', userId].filter(Boolean) });
  };

  const markAllAsRead = async () => {
    await Promise.all(
      notifications.filter(n => !n.read).map(n => notificationStorage.update(n.id, { read: true }))
    );
    queryClient.invalidateQueries({ queryKey: ['notifications', userId].filter(Boolean) });
  };

  const deleteNotification = async (id: string) => {
    await notificationStorage.delete(id);
    queryClient.invalidateQueries({ queryKey: ['notifications', userId].filter(Boolean) });
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  };
};
