import { supabase } from '../lib/supabase';
import { edgeFunctionService } from './edgeFunctionService';

async function lookupEmail(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
    return data?.email || null;
  } catch {
    return null;
  }
}

export const emailNotificationService = {
  async sendNotification(userId: string, subject: string, message: string): Promise<void> {
    const email = await lookupEmail(userId);
    if (!email) return;
    await edgeFunctionService.sendEmail(email, 'notification', {
      subject,
      message,
    }).catch(() => {});
  },
};
