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
    const row: Record<string, any> = {};
    if (data.userId !== undefined) row.user_id = data.userId;
    if (data.title !== undefined) row.title = data.title;
    if (data.message !== undefined) row.message = data.message;
    if (data.read !== undefined) row.read = data.read;
    if (data.type !== undefined) row.type = data.type;
    if (data.link !== undefined) row.link = data.link;

    const { data: created, error } = await supabase
      .from('notifications')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToNotification(created);
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