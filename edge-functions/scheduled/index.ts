import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const cronSecret = req.headers.get('x-cron-secret')
  const expectedSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
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
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Mentorino <notifications@mentorino.com>',
                to: [student.email],
                subject: `Reminder: ${session.title} is coming up`,
                html: `<h1>Session Reminder</h1><p>Your session "<strong>${session.title}</strong>" starts at <strong>${session.start_time}</strong>.</p>${session.meeting_url ? `<p>Join: <a href="${session.meeting_url}">${session.meeting_url}</a></p>` : ''}<p>Duration: ${session.duration || '60 minutes'}</p>`,
              }),
            })
          }
        }

        return new Response(JSON.stringify({ success: true, task: 'session_reminders', count: sessions?.length || 0 }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      case 'inactivity_alerts': {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: inactiveStudents, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'student')
          .lt('updated_at', sevenDaysAgo)

        if (error) throw error

        for (const student of inactiveStudents || []) {
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
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'Mentorino <notifications@mentorino.com>',
                    to: [mentor.email],
                    subject: `Inactivity Alert: ${student.name}`,
                    html: `<h1>Inactivity Alert</h1><p>Your student <strong>${student.name}</strong> has not been active in the past 7 days. Consider reaching out to check in.</p>`,
                  }),
                })
              }
            }
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

            summaryHtml += `<h2>${student.name}</h2>
              <p>Sessions this week: ${sessions?.length || 0} (${attendedSessions} attended)</p>
              <p>Goals: ${completedGoals}/${goals?.length || 0} completed</p><hr/>`
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
        }

        return new Response(JSON.stringify({ success: true, task: 'progress_summaries', count: activeMentors?.length || 0 }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      case 'cleanup': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

        const { error: sessionsCleanup } = await supabase
          .from('sessions')
          .update({ status: 'cancelled', deleted_at: new Date().toISOString() })
          .eq('status', 'scheduled')
          .lt('start_time', thirtyDaysAgo)

        const { error: notificationsCleanup } = await supabase
          .from('notifications')
          .update({ deleted_at: new Date().toISOString() })
          .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

        if (sessionsCleanup) throw sessionsCleanup
        if (notificationsCleanup) throw notificationsCleanup

        return new Response(JSON.stringify({ success: true, task: 'cleanup' }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        })
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown task: ${task}` }), { status: 400, headers: CORS_HEADERS })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS })
  }
})
