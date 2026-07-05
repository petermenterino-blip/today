import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '../constants/queryKeys';
import { notificationStorage } from '../services/notificationStorage';
import { useRealtimeData } from './useRealtimeData';
import { Notification as NotificationType } from '../interfaces';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'notifications', queryKey: ['notifications'] }]);

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationStorage.getAll(),
    staleTime: STALE_TIMES.frequent,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await notificationStorage.update(id, { read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllAsRead = async () => {
    await Promise.all(
      notifications.filter(n => !n.read).map(n => notificationStorage.update(n.id, { read: true }))
    );
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const deleteNotification = async (id: string) => {
    await notificationStorage.delete(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
