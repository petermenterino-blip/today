import { supabase } from '../lib/supabase';
import { Notification } from '../interfaces';

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
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('notificationStorage.getAll error:', error); return []; }
    return (data || []).map(rowToNotification);
  },

  async getByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('notificationStorage.getByUserId error:', error); return []; }
    return (data || []).map(rowToNotification);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) return 0;
    return count || 0;
  },

  async getById(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToNotification(data);
  },

  async create(data: Partial<Notification>): Promise<Notification> {
    const { data: created, error } = await supabase
      .rpc('insert_notification', {
        p_user_id: data.userId,
        p_title: data.title,
        p_message: data.message,
        p_type: data.type || 'system',
      });

    if (error) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'system',
          read: data.read ?? false,
          link: data.link || null,
        })
        .select()
        .single();
      if (fallbackError) throw fallbackError;
      return rowToNotification(fallback);
    }

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
  },

  async update(id: string, updates: Partial<Notification>): Promise<Notification | null> {
    const row: Record<string, any> = {};
    if (updates.read !== undefined) row.read = updates.read;
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.message !== undefined) row.message = updates.message;

    if (Object.keys(row).length > 0) {
      await supabase.from('notifications').update(row).eq('id', id);
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    return !error;
  },

  async seed(items: Notification[]): Promise<void> {
    for (const item of items) {
      await this.create(item);
    }
  },
};