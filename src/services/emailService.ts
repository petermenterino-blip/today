import { supabase } from '../lib/supabase';
import { edgeFunctionService } from './edgeFunctionService';
import { emailTemplateService } from './emailTemplateService';
import { handleError } from '../lib/serviceHelper';
import {
  EmailLog,
  EmailType,
  BookingType,
  EmailStatus,
  EmailTemplate,
  BOOKING_TEMPLATE_KEYS,
  MENTOR_NOTIFICATION_EMAIL,
} from '../types/email';

interface SendBookingEmailParams {
  bookingId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  callType: BookingType;
  date: string;
  time: string;
  meetingType?: string;
  message?: string;
}

interface EmailLogFilter {
  search?: string;
  status?: EmailStatus;
  emailType?: EmailType;
  bookingType?: BookingType;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const emailService = {
  async sendBookingConfirmation(params: SendBookingEmailParams): Promise<void> {
    try {
      const { data: tmpl } = await emailTemplateService.fetchByKey(BOOKING_TEMPLATE_KEYS.VISITOR_CONFIRMATION);
      if (!tmpl) {
        await this.logError(params.bookingId, params.visitorEmail, BOOKING_TEMPLATE_KEYS.VISITOR_CONFIRMATION, 'visitor_confirmation', params.callType, 'Template not found');
        return;
      }
      const { subject, html } = this.renderBookingTemplate(tmpl, params);
      const result = await edgeFunctionService.sendPublicEmail(params.visitorEmail, subject, html);
      await this.logResult(params.bookingId, params.visitorEmail, subject, BOOKING_TEMPLATE_KEYS.VISITOR_CONFIRMATION, 'visitor_confirmation', params.callType, result);
    } catch (err: any) {
      console.warn('[emailService] sendBookingConfirmation error:', err);
      await this.logError(params.bookingId, params.visitorEmail, BOOKING_TEMPLATE_KEYS.VISITOR_CONFIRMATION, 'visitor_confirmation', params.callType, err?.message || 'Unknown error');
    }
  },

  async sendMentorNotification(params: SendBookingEmailParams): Promise<void> {
    try {
      const { data: tmpl } = await emailTemplateService.fetchByKey(BOOKING_TEMPLATE_KEYS.MENTOR_NOTIFICATION);
      if (!tmpl) {
        await this.logError(params.bookingId, MENTOR_NOTIFICATION_EMAIL, BOOKING_TEMPLATE_KEYS.MENTOR_NOTIFICATION, 'mentor_notification', params.callType, 'Template not found');
        return;
      }
      const { subject, html } = this.renderBookingTemplate(tmpl, params);
      const result = await edgeFunctionService.sendPublicEmail(MENTOR_NOTIFICATION_EMAIL, subject, html);
      await this.logResult(params.bookingId, MENTOR_NOTIFICATION_EMAIL, subject, BOOKING_TEMPLATE_KEYS.MENTOR_NOTIFICATION, 'mentor_notification', params.callType, result);
    } catch (err: any) {
      console.warn('[emailService] sendMentorNotification error:', err);
      await this.logError(params.bookingId, MENTOR_NOTIFICATION_EMAIL, BOOKING_TEMPLATE_KEYS.MENTOR_NOTIFICATION, 'mentor_notification', params.callType, err?.message || 'Unknown error');
    }
  },

  async sendBookingEmails(params: SendBookingEmailParams): Promise<void> {
    await Promise.allSettled([
      this.sendBookingConfirmation(params),
      this.sendMentorNotification(params),
    ]);
  },

  renderBookingTemplate(template: EmailTemplate, data: SendBookingEmailParams): { subject: string; html: string } {
    const map: Record<string, string> = {
      visitorName: data.visitorName,
      visitorEmail: data.visitorEmail,
      visitorPhone: data.visitorPhone || '',
      callType: data.callType === 'intro' ? 'Free Intro' : 'Rapid Response',
      date: data.date,
      time: data.time,
      meetingType: data.meetingType || 'Not specified',
      message: data.message || '',
      email: data.visitorEmail,
    };
    const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] || '');
    const html = template.body.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] || '');
    return { subject, html };
  },

  async logResult(
    bookingId: string,
    recipientEmail: string,
    subject: string,
    templateKey: string,
    emailType: EmailType,
    bookingType: BookingType,
    result: { success: boolean; id?: string },
  ): Promise<void> {
    const status: EmailStatus = result.success ? 'sent' : 'failed';
    const now = new Date().toISOString();
    const { error } = await supabase.from('email_logs').insert({
      booking_id: bookingId,
      recipient_email: recipientEmail,
      subject,
      template_key: templateKey,
      status,
      email_type: emailType,
      booking_type: bookingType,
      sent_at: result.success ? now : null,
      failure_reason: result.success ? null : 'Edge function returned failure',
    });
    if (error) console.warn('[emailService] logResult insert error:', error.message);
  },

  async logError(
    bookingId: string,
    recipientEmail: string,
    templateKey: string,
    emailType: EmailType,
    bookingType: BookingType,
    failureReason: string,
  ): Promise<void> {
    const { error } = await supabase.from('email_logs').insert({
      booking_id: bookingId,
      recipient_email: recipientEmail,
      subject: '',
      template_key: templateKey,
      status: 'failed',
      email_type: emailType,
      booking_type: bookingType,
      failure_reason: failureReason,
    });
    if (error) console.warn('[emailService] logError insert error:', error.message);
  },

  async fetchLogs(filter: EmailLogFilter = {}): Promise<{ data: EmailLog[]; total: number; error: string | null }> {
    try {
      let query = supabase.from('email_logs').select('*', { count: 'exact' });

      if (filter.search) {
        const s = `%${filter.search}%`;
        query = query.or(`recipient_email.ilike.${s},subject.ilike.${s},template_key.ilike.${s}`);
      }
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.emailType) query = query.eq('email_type', filter.emailType);
      if (filter.bookingType) query = query.eq('booking_type', filter.bookingType);

      const sortCol = filter.sortBy || 'created_at';
      const sortOrd = filter.sortOrder || 'desc';
      query = query.order(sortCol, { ascending: sortOrd === 'asc' });

      if (filter.limit) query = query.range(filter.offset || 0, (filter.offset || 0) + filter.limit - 1);

      const { data, error, count } = await query;
      if (error) return { data: [], total: 0, error: handleError(error).error };
      return { data: (data || []) as EmailLog[], total: count || 0, error: null };
    } catch (err: any) {
      return { data: [], total: 0, error: handleError(err).error };
    }
  },

  async resendEmail(logId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: log, error: fetchError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', logId)
        .single();
      if (fetchError || !log) return { success: false, error: fetchError?.message || 'Email log not found' };

      if (!log.template_key) return { success: false, error: 'No template key associated with this email' };

      const { data: tmpl, error: tmplError } = await emailTemplateService.fetchByKey(log.template_key);
      if (tmplError || !tmpl) return { success: false, error: tmplError || 'Template not found' };

      const { subject, html } = emailTemplateService.render(tmpl, {});
      const result = await edgeFunctionService.sendCustomEmail(log.recipient_email, subject, html);

      const now = new Date().toISOString();
      await supabase
        .from('email_logs')
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? now : null,
          failure_reason: result.success ? null : 'Resend failed',
        })
        .eq('id', logId);

      return { success: result.success, error: result.success ? null : 'Resend failed' };
    } catch (err: any) {
      return { success: false, error: handleError(err).error };
    }
  },

  async updateLogStatus(logId: string, status: EmailStatus, failureReason?: string): Promise<void> {
    const update: Record<string, any> = { status };
    if (status === 'sent') update.sent_at = new Date().toISOString();
    if (failureReason) update.failure_reason = failureReason;
    await supabase.from('email_logs').update(update).eq('id', logId);
  },
};
