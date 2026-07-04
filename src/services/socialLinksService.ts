import { supabase } from '../lib/supabase';

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
  sort_order: number;
  created_by?: string;
}

export const socialLinksService = {
  async fetchAll(): Promise<{ data: SocialLink[]; error: string | null }> {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  },

  async save(links: { id?: string; platform: string; url: string; enabled: boolean; sort_order: number }[]): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const existing = await this.fetchAll();
    const existingIds = existing.data.map(l => l.id);

    for (const link of links) {
      if (link.id && existingIds.includes(link.id)) {
        const { error } = await supabase
          .from('social_links')
          .update({
            url: link.url,
            enabled: link.enabled,
            sort_order: link.sort_order,
          })
          .eq('id', link.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase
          .from('social_links')
          .insert({
            platform: link.platform,
            url: link.url,
            enabled: link.enabled,
            sort_order: link.sort_order,
            created_by: user.id,
          });
        if (error) return { error: error.message };
      }
    }

    return { error: null };
  },

  async toggleVisibility(id: string, enabled: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('social_links')
      .update({ enabled })
      .eq('id', id);
    return { error: error?.message || null };
  },
};
