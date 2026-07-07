import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  const startTime = Date.now()

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'scheduled' }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  const cronSecret = req.headers.get('x-cron-secret')
  const expectedSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
    console.warn('[scheduled] unauthorized attempt')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers: CORS_HEADERS })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { task } = await req.json()

    switch (task) {
      case 'session_reminders': {
        console.log('[scheduled] task=session_reminders starting')
        const now = new Date()
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        const { data: sessions, error } = await supabase
          .from('sessions')
          .select('id, title, start_time, meeting_url, duration, student_id, mentor_id')
          .gte('start_time', now.toISOString())
          .lte('start_time', in24h.toISOString())
          .eq('status', 'scheduled')

        if (error) throw error

        for (const session of sessions || []) {
          try {
            const { data: student } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', session.student_id)
              .single()

            const { data: mentor } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', session.mentor_id)
              .single()

            const resendApiKey = Deno.env.get('RESEND_API_KEY')
            if (resendApiKey && student?.email) {
              const safeTitle = escapeHtml(session.title || '')
              const safeTime = escapeHtml(session.start_time || '')
              const safeUrl = escapeHtml(session.meeting_url || '')
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Mentorino <notifications@mentorino.com>',
                  to: [student.email],
                  subject: `Reminder: ${safeTitle} is coming up`,
                  html: `<h1>Session Reminder</h1><p>Your session "<strong>${safeTitle}</strong>" starts at <strong>${safeTime}</strong>.</p>${safeUrl ? `<p>Join: <a href="${safeUrl}">${safeUrl}</a></p>` : ''}<p>Duration: ${escapeHtml(session.duration || '60 minutes')}</p>`,
                }),
              })
            }
          } catch (err) {
            console.error(`[scheduled] session_reminders iteration error for session ${session.id}:`, err)
          }
        }

        console.log(`[scheduled] session_reminders complete: count=${sessions?.length || 0} duration=${Date.now() - startTime}ms`)
        return new Response(JSON.stringify({ success: true, task: 'session_reminders', count: sessions?.length || 0 }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      case 'inactivity_alerts': {
        console.log('[scheduled] task=inactivity_alerts starting')
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: inactiveStudents, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'student')
          .lt('updated_at', sevenDaysAgo)

        if (error) throw error

        for (const student of inactiveStudents || []) {
          try {
            const { data: enrollment } = await supabase
              .from('program_enrollments')
              .select('program:program_id(mentor_id)')
              .eq('student_id', student.id)
              .maybeSingle()

            const mentorId = enrollment?.program?.mentor_id
            if (mentorId) {
              const { data: mentor } = await supabase
                .from('profiles')
                .select('email, name')
                .eq('id', mentorId)
                .single()

              if (mentor?.email) {
                const resendApiKey = Deno.env.get('RESEND_API_KEY')
                if (resendApiKey) {
                  const safeName = escapeHtml(student.name || '')
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${resendApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'Mentorino <notifications@mentorino.com>',
                      to: [mentor.email],
                      subject: `Inactivity Alert: ${safeName}`,
                      html: `<h1>Inactivity Alert</h1><p>Your student <strong>${safeName}</strong> has not been active in the past 7 days. Consider reaching out to check in.</p>`,
                    }),
                  })
                }
              }
            }
          } catch (err) {
            console.error(`[scheduled] inactivity_alerts iteration error for student ${student.id}:`, err)
          }
        }

        return new Response(JSON.stringify({ success: true, task: 'inactivity_alerts', count: inactiveStudents?.length || 0 }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      case 'progress_summaries': {
        const { data: activeMentors, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'mentor')

        if (error) throw error

        for (const mentor of activeMentors || []) {
          try {
            const { data: programs } = await supabase
              .from('programs')
              .select('id')
              .eq('mentor_id', mentor.id)

            const programIds = programs?.map(p => p.id) || []
            if (!programIds.length) continue

            const { data: enrollments } = await supabase
              .from('program_enrollments')
              .select('student_id')
              .in('program_id', programIds)

            const studentIds = enrollments?.map(e => e.student_id) || []
            if (!studentIds.length) continue

            const { data: students } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', studentIds)
              .eq('role', 'student')

            if (!students?.length) continue

            let summaryHtml = '<h1>Weekly Progress Summary</h1>'
            for (const student of students) {
              try {
                const { data: sessions } = await supabase
                  .from('sessions')
                  .select('id, title, start_time, attendance_status')
                  .eq('student_id', student.id)
                  .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

                const { data: goals } = await supabase
                  .from('goals')
                  .select('id, title, status')
                  .eq('student_id', student.id)

                const completedGoals = (goals || []).filter(g => g.status === 'completed').length
                const attendedSessions = (sessions || []).filter(s => s.attendance_status === 'attended').length
                const safeName = escapeHtml(student.name || '')

                summaryHtml += `<h2>${safeName}</h2>
                  <p>Sessions this week: ${sessions?.length || 0} (${attendedSessions} attended)</p>
                  <p>Goals: ${completedGoals}/${goals?.length || 0} completed</p><hr/>`
              } catch (err) {
                console.error(`[scheduled] progress_summaries student iteration error for ${student.id}:`, err)
              }
            }

            const resendApiKey = Deno.env.get('RESEND_API_KEY')
            if (resendApiKey && mentor.email) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Mentorino <notifications@mentorino.com>',
                  to: [mentor.email],
                  subject: 'Weekly Progress Summary',
                  html: summaryHtml,
                }),
              })
            }
          } catch (err) {
            console.error(`[scheduled] progress_summaries mentor iteration error for ${mentor.id}:`, err)
          }
        }

        return new Response(JSON.stringify({ success: true, task: 'progress_summaries', count: activeMentors?.length || 0 }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      case 'cleanup': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        const results: Record<string, number> = {}

        const { error: sessionsCleanup, count: sessionsCount } = await supabase
          .from('sessions')
          .update({ status: 'cancelled', deleted_at: new Date().toISOString() })
          .eq('status', 'scheduled')
          .lt('start_time', thirtyDaysAgo)
        if (sessionsCleanup) throw sessionsCleanup
        results.sessions_cleaned = sessionsCount || 0

        const { error: notificationsCleanup, count: notifsCount } = await supabase
          .from('notifications')
          .update({ deleted_at: new Date().toISOString() })
          .lt('created_at', ninetyDaysAgo)
        if (notificationsCleanup) throw notificationsCleanup
        results.notifications_cleaned = notifsCount || 0

        const { error: rateLimitsCleanup, count: rlCount } = await supabase
          .from('rate_limits')
          .delete()
          .lt('expires_at', new Date().toISOString())
        if (rateLimitsCleanup) throw rateLimitsCleanup
        results.rate_limits_cleaned = rlCount || 0

        console.log(`[scheduled] cleanup complete: ${JSON.stringify(results)} duration=${Date.now() - startTime}ms`)
    return new Response(JSON.stringify({ success: true, task: 'cleanup', results }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      default:
        console.warn(`[scheduled] unknown task: ${task}`)
        return new Response(JSON.stringify({ error: `Unknown task: ${task}` }), { status: 400, headers: CORS_HEADERS })
    }
  } catch (err) {
    console.error('[scheduled] handler error:', err)
    return new Response(JSON.stringify({ error: 'Scheduled task failed' }), { status: 500, headers: CORS_HEADERS })
  }
})
