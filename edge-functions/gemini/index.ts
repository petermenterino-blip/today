import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { verifyAuth, requireRole, CORS_HEADERS } from '../middleware/auth.ts'

const SYSTEM_PROMPTS: Record<string, string> = {
  application_summary: 'You are a mentor reviewing a student application. Summarize the key points and highlight any concerns or strengths in 2-3 sentences.',
  session_brief: 'You are an assistant preparing session notes. Summarize key discussion points, action items, and follow-up questions based on the context.',
  feedback: 'You are a mentor providing constructive feedback. Be supportive, specific, and actionable. Keep it to 3-5 bullet points.',
  insights: 'You are a mentor analytics assistant. Identify patterns, progress trends, and areas needing attention based on the student data provided.',
  chat: 'You are Mentorino AI, a helpful assistant for mentors and students. Answer questions concisely and supportively.',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization')
  const { user, error } = await verifyAuth(authHeader)
  if (error) return error

  const roleError = requireRole(user, ['student', 'mentor', 'admin'])
  if (roleError) return roleError

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), { status: 500, headers: CORS_HEADERS })
  }

  try {
    const { prompt, context, type } = await req.json()
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat
    const contextBlock = context ? `\n\nContext:\n${JSON.stringify(context, null, 2)}` : ''

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}${contextBlock}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    )

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return new Response(JSON.stringify({ result: text, type }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS })
  }
})
