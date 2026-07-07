import { supabase } from '../lib/supabase';
import { edgeFunctionService } from './edgeFunctionService';
import { EmailTemplate } from '../types/email';
import { handleError } from '../lib/serviceHelper';

export const emailTemplateService = {
  async fetchAll(): Promise<{ data: EmailTemplate[]; error: string | null }> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('key');
    if (error) return { data: [], error: handleError(error).error };
    return { data: data || [], error: null };
  },

  async fetchByKey(key: string): Promise<{ data: EmailTemplate | null; error: string | null }> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('key', key)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data, error: null };
  },

  async update(key: string, payload: { subject: string; body: string }): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('email_templates')
      .update({ subject: payload.subject, body: payload.body, updated_at: new Date().toISOString() })
      .eq('key', key);
    if (error) return { error: handleError(error).error };
    return { error: null };
  },

  render(template: EmailTemplate, data: Record<string, string>): { subject: string; html: string } {
    const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
    const html = template.body.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
    return { subject, html };
  },

  async send(templateKey: string, to: string, data: Record<string, string>): Promise<{ error: string | null }> {
    const { data: tmpl, error: fetchError } = await this.fetchByKey(templateKey);
    if (fetchError || !tmpl) return { error: fetchError || 'Template not found' };
    const { subject, html } = this.render(tmpl, data);
    const result = await edgeFunctionService.sendCustomEmail(to, subject, html);
    return result.success ? { error: null } : { error: 'Failed to send email' };
  },

  async sendBroadcast(
    templateKey: string,
    recipients: { email: string; name: string }[],
    data: Record<string, string>,
  ): Promise<{ sent: number; errors: number }> {
    const { data: tmpl, error: fetchError } = await this.fetchByKey(templateKey);
    if (fetchError || !tmpl) return { sent: 0, errors: recipients.length };

    let sent = 0;
    let errors = 0;
    for (const recipient of recipients) {
      const mergedData = { ...data, name: recipient.name, email: recipient.email };
      const { subject, html } = this.render(tmpl, mergedData);
      const result = await edgeFunctionService.sendCustomEmail(recipient.email, subject, html);
      if (result.success) sent++;
      else errors++;
    }
    return { sent, errors };
  },
};
