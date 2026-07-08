import { supabase } from '../lib/supabase';
import { Notification } from '../interfaces';
import { safeQuery, safeMutate } from '../lib/supabaseFallback';
import { interpretError, isNetworkError } from '../lib/errorHandler';

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    read: row.read || false,
    type: row.type,
    link: row.link,
    createdAt: row.created_at,
  };
}

export const notificationStorage = {
  async getAll(): Promise<Notification[]> {
    const result = await safeQuery(
      'notificationStorage.getAll',
      () => supabase.from('notifications').select('id,user_id,title,message,read,type,link,created_at').order('created_at', { ascending: false }).limit(50),
      [],
      'notifications',
    );
    if (result.error) console.warn('notificationStorage.getAll:', interpretError(result.error));
    return (result.data || []).map(rowToNotification);
  },

  async getByUserId(userId: string): Promise<Notification[]> {
    const result = await safeQuery(
      'notificationStorage.getByUserId',
      () => supabase.from('notifications').select('id,user_id,title,message,read,type,link,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      [],
      `notifications:${userId}`,
    );
    if (result.error) console.warn('notificationStorage.getByUserId:', interpretError(result.error));
    return (result.data || []).map(rowToNotification);
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) {
        if (isNetworkError(error)) return 0;
        console.warn('notificationStorage.getUnreadCount:', interpretError(error));
        return 0;
      }
      return count || 0;
    } catch {
      return 0;
    }
  },

  async getById(id: string): Promise<Notification | null> {
    const result = await safeQuery(
      'notificationStorage.getById',
      () => supabase.from('notifications').select('id,user_id,title,message,read,type,link,created_at').eq('id', id).single(),
      null,
    );
    if (result.error || !result.data) return null;
    return rowToNotification(result.data);
  },

  async create(data: Partial<Notification>): Promise<Notification> {
    const rpcResult = await safeMutate(
      'notificationStorage.create',
      () => supabase.rpc('insert_notification', {
        p_user_id: data.userId,
        p_title: data.title,
        p_message: data.message,
        p_type: data.type || 'system',
        p_link: data.link || null,
      }),
    );

    if (!rpcResult.error && rpcResult.data) {
      return {
        id: '',
        userId: data.userId || '',
        title: data.title || '',
        message: data.message || '',
        read: data.read ?? false,
        type: data.type || 'system',
        link: data.link,
        createdAt: new Date().toISOString(),
      };
    }

    const fallbackResult = await safeMutate(
      'notificationStorage.createFallback',
      () => supabase.from('notifications').insert({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'system',
        read: data.read ?? false,
        link: data.link || null,
      }).select().single(),
      'notifications',
    );
    if (fallbackResult.error || !fallbackResult.data) throw new Error(interpretError(fallbackResult.error));
    return rowToNotification(fallbackResult.data);
  },

  async update(id: string, updates: Partial<Notification>): Promise<Notification | null> {
    const row: Record<string, any> = {};
    if (updates.read !== undefined) row.read = updates.read;
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.message !== undefined) row.message = updates.message;

    if (Object.keys(row).length > 0) {
      const result = await safeMutate(
        'notificationStorage.update',
        () => supabase.from('notifications').update(row).eq('id', id),
        'notifications',
      );
      if (result.error) {
        console.warn('notificationStorage.update:', interpretError(result.error));
        return null;
      }
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const result = await safeMutate(
      'notificationStorage.delete',
      () => supabase.from('notifications').delete().eq('id', id),
      'notifications',
    );
    if (result.error) console.warn('notificationStorage.delete:', interpretError(result.error));
    return !result.error;
  },

};