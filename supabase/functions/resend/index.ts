import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface EmailRequest {
  to: string
  template: 'welcome' | 'session_reminder' | 'application_update' | 'notification'
  data: Record<string, any>
}

const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  welcome: (data) => ({
    subject: 'Welcome to Mentorino!',
    html: `<h1>Welcome, ${data.name}!</h1><p>We're excited to have you on board. Your mentor will be in touch soon.</p><p>In the meantime, feel free to explore your dashboard and set up your profile.</p><p>Best,<br/>The Mentorino Team</p>`,
  }),
  session_reminder: (data) => ({
    subject: `Reminder: ${data.sessionTitle} is coming up`,
    html: `<h1>Session Reminder</h1><p>Hi ${data.name},</p><p>Your session "<strong>${data.sessionTitle}</strong>" starts at <strong>${data.startTime}</strong>.</p>${data.meetingUrl ? `<p>Join: <a href="${data.meetingUrl}">${data.meetingUrl}</a></p>` : ''}<p>Duration: ${data.duration || '60 minutes'}</p><p>Best,<br/>The Mentorino Team</p>`,
  }),
  application_update: (data) => ({
    subject: `Application ${data.status}`,
    html: `<h1>Application Update</h1><p>Hi ${data.name},</p><p>Your application has been <strong>${data.status}</strong>.</p><p>Program: ${data.programTitle || 'Mentorino Program'}</p>${data.feedback ? `<p>Feedback: ${data.feedback}</p>` : ''}<p>Best,<br/>The Mentorino Team</p>`,
  }),
  notification: (data) => ({
    subject: data.title,
    html: `<h1>${data.title}</h1><p>Hi ${data.name || 'there'},</p><p>${data.message}</p><p>Best,<br/>The Mentorino Team</p>`,
  }),
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: CORS_HEADERS })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: CORS_HEADERS })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'mentor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS_HEADERS })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'Resend not configured' }), { status: 500, headers: CORS_HEADERS })
  }

  try {
    const { to, template, data }: EmailRequest = await req.json()

    const templateFn = TEMPLATES[template]
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), { status: 400, headers: CORS_HEADERS })
    }

    const { subject, html } = templateFn(data)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mentorino <notifications@mentorino.com>',
        to: [to],
        subject,
        html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result.message || 'Resend API error' }), { status: response.status, headers: CORS_HEADERS })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS })
  }
})
