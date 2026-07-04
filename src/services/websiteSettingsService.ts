import { supabase } from '../lib/supabase';

export interface WebsiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  footer_text: string;
  copyright: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  logo_url: string;
}

export const websiteSettingsService = {
  async get(): Promise<{ data: WebsiteSettings | null; error: string | null }> {
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  async update(settings: Partial<WebsiteSettings>): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: existing } = await supabase
      .from('website_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing?.id) {
      const { error } = await supabase
        .from('website_settings')
        .update({ ...settings, updated_by: user?.id })
        .eq('id', existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from('website_settings')
        .insert({ ...settings, updated_by: user?.id });
      if (error) return { error: error.message };
    }

    return { error: null };
  },
};
