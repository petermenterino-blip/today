import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { verifyAuth, requireRole, getCorsHeaders, CORS_HEADERS, checkRateLimit, getRateLimitKey } from '../middleware/auth.ts'

interface EmailRequest {
  to: string
  template: 'welcome' | 'session_reminder' | 'application_update' | 'notification'
  data: Record<string, any>
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  welcome: (data) => ({
    subject: 'Welcome to Mentorino!',
    html: `<h1>Welcome, ${esc(data.name)}!</h1><p>We're excited to have you on board. Your mentor will be in touch soon.</p>
<p>Here are your login details:</p>
<ul>
  <li><strong>Email:</strong> ${esc(data.email)}</li>
  <li><strong>Temporary Password:</strong> ${esc(data.tempPassword)}</li>
</ul>
<p>Please sign in at <a href="https://mentorino.app/#/auth">mentorino.app</a> and change your password after your first login.</p>
<p>In the meantime, feel free to explore your dashboard and set up your profile.</p>
<p>Best,<br/>The Mentorino Team</p>`,
  }),
  session_reminder: (data) => ({
    subject: `Reminder: ${esc(data.sessionTitle)} is coming up`,
    html: `<h1>Session Reminder</h1><p>Hi ${esc(data.name)},</p><p>Your session "<strong>${esc(data.sessionTitle)}</strong>" starts at <strong>${esc(data.startTime)}</strong>.</p>${data.meetingUrl ? `<p>Join: <a href="${esc(data.meetingUrl)}">${esc(data.meetingUrl)}</a></p>` : ''}<p>Duration: ${esc(data.duration || '60 minutes')}</p><p>Best,<br/>The Mentorino Team</p>`,
  }),
  application_update: (data) => ({
    subject: `Application ${esc(data.status)}`,
    html: `<h1>Application Update</h1><p>Hi ${esc(data.name)},</p><p>Your application has been <strong>${esc(data.status)}</strong>.</p><p>Program: ${esc(data.programTitle || 'Mentorino Program')}</p>${data.feedback ? `<p>Feedback: ${esc(data.feedback)}</p>` : ''}<p>Best,<br/>The Mentorino Team</p>`,
  }),
  notification: (data) => ({
    subject: esc(data.title),
    html: `<h1>${esc(data.title)}</h1><p>Hi ${esc(data.name || 'there')},</p><p>${esc(data.message)}</p><p>Best,<br/>The Mentorino Team</p>`,
  }),
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const startTime = Date.now()

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'resend' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const authHeader = req.headers.get('Authorization')
  const { user, error } = await verifyAuth(authHeader)
  if (error) return error

  const roleError = requireRole(user, ['mentor'])
  if (roleError) return roleError

  const rateKey = getRateLimitKey('resend', user.id, req.headers.get('x-forwarded-for') || '')
  const { allowed, retryAfterMs } = await checkRateLimit(rateKey, 'resend')
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)), ...corsHeaders } },
    )
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'Resend not configured' }), { status: 500, headers: corsHeaders })
  }

  try {
    const { to, template, data }: EmailRequest = await req.json()

    if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: 'A valid recipient email is required' }), { status: 400, headers: corsHeaders })
    }

    const templateFn = TEMPLATES[template]
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), { status: 400, headers: corsHeaders })
    }

    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'data object is required' }), { status: 400, headers: corsHeaders })
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
      console.error(`[resend] API error: ${response.status} to=${to} template=${template} userId=${user.id.slice(0, 8)}`)
      return new Response(JSON.stringify({ error: 'Failed to send email. Please try again later.' }), { status: 502, headers: corsHeaders })
    }

    console.log(`[resend] success: to=${to} template=${template} userId=${user.id.slice(0, 8)} duration=${Date.now() - startTime}ms`)
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[resend] handler error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: corsHeaders })
  }
})
