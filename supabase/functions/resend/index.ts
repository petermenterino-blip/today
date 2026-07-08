import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { verifyAuth, requireRole, getCorsHeaders, CORS_HEADERS, checkRateLimit, getRateLimitKey, checkPublicRateLimit } from '../middleware/auth.ts'

interface EmailRequest {
  to: string
  template?: 'welcome' | 'session_reminder' | 'application_update' | 'notification'
  data?: Record<string, any>
  subject?: string
  html?: string
  public?: boolean
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

  let requestUserId: string | null = null

  const body: EmailRequest = await req.json()

  if (!body.to || typeof body.to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
    return new Response(JSON.stringify({ error: 'A valid recipient email is required' }), { status: 400, headers: corsHeaders })
  }

  if (body.public) {
    if (body.template || body.data) {
      return new Response(JSON.stringify({ error: 'Template emails are not available on public endpoint' }), { status: 400, headers: corsHeaders })
    }
    if (!body.subject || !body.html) {
      return new Response(JSON.stringify({ error: 'subject and html are required for public emails' }), { status: 400, headers: corsHeaders })
    }
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const { allowed, retryAfterMs } = await checkPublicRateLimit(ip, 'resend')
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)), ...corsHeaders } },
      )
    }
  } else {
    const authHeader = req.headers.get('Authorization')
    const { user, error } = await verifyAuth(authHeader)
    if (error) return error
    requestUserId = user.id

    if (body.subject && body.html) {
      const roleError = requireRole(user, ['student', 'mentor'])
      if (roleError) return roleError
    } else {
      const roleError = requireRole(user, ['mentor'])
      if (roleError) return roleError
    }

    const rateKey = getRateLimitKey('resend', user.id, req.headers.get('x-forwarded-for') || '')
    const { allowed, retryAfterMs } = await checkRateLimit(rateKey, 'resend')
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)), ...corsHeaders } },
      )
    }
  }

  const { to, template, data, subject: customSubject, html: customHtml } = body

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'Resend not configured' }), { status: 500, headers: corsHeaders })
  }

  try {
    let subject: string
    let html: string

    if (customSubject && customHtml) {
      subject = customSubject
      html = customHtml
    } else {
      if (!template) {
        return new Response(JSON.stringify({ error: 'Either template or subject+html is required' }), { status: 400, headers: corsHeaders })
      }
      const templateFn = TEMPLATES[template]
      if (!templateFn) {
        return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), { status: 400, headers: corsHeaders })
      }
      if (!data || typeof data !== 'object') {
        return new Response(JSON.stringify({ error: 'data object is required' }), { status: 400, headers: corsHeaders })
      }
      const rendered = templateFn(data)
      subject = rendered.subject
      html = rendered.html
    }

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
      console.error(`[resend] API error: ${response.status} to=${to} template=${template} userId=${requestUserId || 'public'}`)
      return new Response(JSON.stringify({ error: 'Failed to send email. Please try again later.' }), { status: 502, headers: corsHeaders })
    }

    console.log(`[resend] success: to=${to} template=${template || 'custom'} userId=${requestUserId || 'public'} duration=${Date.now() - startTime}ms`)
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[resend] handler error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: corsHeaders })
  }
})
