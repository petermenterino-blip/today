import { supabase } from '../lib/supabase'
import { isNetworkError } from '../lib/errorHandler'

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
    try {
      const { data, error } = await supabase.functions.invoke<GeminiResponse>('gemini', {
        body: { prompt, type, context },
      })
      if (error) throw new Error(error.message)
      return data?.result || ''
    } catch (err: any) {
      if (isNetworkError(err)) return 'AI features are unavailable offline.'
      console.warn('[EdgeFunction] gemini error:', err?.message || err)
      return "I'm sorry, I'm experiencing some technical difficulties. Please try again."
    }
  },

  async sendEmail(
    to: string,
    template: 'welcome' | 'session_reminder' | 'application_update' | 'notification',
    data: Record<string, any>
  ): Promise<EmailResponse> {
    try {
      const { data: result, error } = await supabase.functions.invoke<EmailResponse>('resend', {
        body: { to, template, data },
      })
      if (error) throw new Error(error.message)
      return result || { success: false }
    } catch (err: any) {
      if (isNetworkError(err)) return { success: false }
      console.warn('[EdgeFunction] sendEmail error:', err?.message || err)
      return { success: false }
    }
  },

  async runScheduledTask(task: 'session_reminders' | 'inactivity_alerts' | 'progress_summaries' | 'cleanup'): Promise<ScheduledResponse> {
    try {
      const { data, error } = await supabase.functions.invoke<ScheduledResponse>('scheduled', {
        body: { task },
      })
      if (error) throw new Error(error.message)
      return data || { success: false, task }
    } catch (err: any) {
      if (isNetworkError(err)) return { success: false, task }
      console.warn('[EdgeFunction] scheduled task error:', err?.message || err)
      return { success: false, task }
    }
  },
}
