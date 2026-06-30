import { supabase } from '../lib/supabase'

type GeminiType = 'application_summary' | 'session_brief' | 'feedback' | 'insights' | 'chat'

interface GeminiResponse {
  result: string
  type: GeminiType
}

interface EmailResponse {
  success: boolean
  id?: string
}

interface ScheduledResponse {
  success: boolean
  task: string
  count?: number
}

export const edgeFunctionService = {
  async gemini(prompt: string, type: GeminiType = 'chat', context?: Record<string, any>): Promise<string> {
    const { data, error } = await supabase.functions.invoke<GeminiResponse>('gemini', {
      body: { prompt, type, context },
    })
    if (error) throw new Error(error.message)
    return data?.result || ''
  },

  async sendEmail(
    to: string,
    template: 'welcome' | 'session_reminder' | 'application_update' | 'notification',
    data: Record<string, any>
  ): Promise<EmailResponse> {
    const { data: result, error } = await supabase.functions.invoke<EmailResponse>('resend', {
      body: { to, template, data },
    })
    if (error) throw new Error(error.message)
    return result || { success: false }
  },

  async runScheduledTask(task: 'session_reminders' | 'inactivity_alerts' | 'progress_summaries' | 'cleanup'): Promise<ScheduledResponse> {
    const { data, error } = await supabase.functions.invoke<ScheduledResponse>('scheduled', {
      body: { task },
    })
    if (error) throw new Error(error.message)
    return data || { success: false, task }
  },
}
