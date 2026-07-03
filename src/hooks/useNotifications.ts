import { useState, useEffect, useCallback } from 'react';
import { notificationStorage } from '../services/notificationStorage';
import { Notification as NotificationType } from '../interfaces';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await notificationStorage.getAll();
    setNotifications(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const handler = (e: StorageEvent) => {
      if (e.key === 'notifications_sync') load();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [load]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await notificationStorage.update(id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.read).map(n => notificationStorage.update(n.id, { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await notificationStorage.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: load,
  };
};
