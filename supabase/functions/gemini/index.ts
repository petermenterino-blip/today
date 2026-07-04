import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { verifyAuth, requireRole, CORS_HEADERS } from '../middleware/auth.ts'

const SYSTEM_PROMPTS: Record<string, string> = {
  chat:
    'You are Mentorino AI, the intelligent assistant for the Mentorino mentoring platform. Answer concisely, use markdown, suggest quick actions when relevant using format [Action: actionId] Label.',
  application_summary:
    'You are a mentor reviewing a student application. Summarize the key points and highlight any concerns or strengths in 2-3 sentences.',
  session_brief:
    'You are an assistant preparing session notes. Summarize key discussion points, action items, and follow-up questions.',
  feedback:
    'You are a mentor providing constructive feedback. Be supportive, specific, and actionable. Keep it to 3-5 bullet points.',
  insights:
    'You are a mentor analytics assistant. Identify patterns, progress trends, and areas needing attention.',
}

function buildContents(systemPrompt: string, messages: { role: string; content: string }[] | undefined, userPrompt: string, context: any) {
  const contextBlock = context ? `\n\nContext:\n${JSON.stringify(context, null, 2).slice(0, 20000)}` : ''
  const historyBlock = messages && messages.length > 0
    ? `\n\nConversation history:\n${messages.map((m) => `${m.role}: ${m.content.slice(0, 2000)}`).join('\n')}`
    : ''

  return [
    {
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${userPrompt}${contextBlock}${historyBlock}` }],
    },
  ]
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
    return new Response(
      JSON.stringify({ error: 'AI service is not configured. Please contact the administrator to set up the GEMINI_API_KEY.' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }

  try {
    const { prompt, context, type, messages, systemPrompt: customSystem, stream, temperature, maxTokens } = await req.json()
    const systemPrompt = customSystem || SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat
    const contents = buildContents(systemPrompt, messages, prompt, context)

    const isStreaming = stream === true

    if (isStreaming) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 4096 },
          }),
        },
      )

      if (!response.ok) {
        const errText = await response.text()
        return new Response(
          JSON.stringify({ error: `AI provider error: ${response.status}. ${errText.slice(0, 500)}` }),
          { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
        )
      }

      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const streamBody = new ReadableStream({
        async start(controller) {
          try {
            let buffer = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim()
                  if (!jsonStr || jsonStr === '[DONE]') continue
                  try {
                    const chunk = JSON.parse(jsonStr)
                    const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                    if (text) {
                      controller.enqueue(encoder.encode(JSON.stringify({ token: text }) + '\n'))
                    }
                  } catch {
                    // skip malformed chunks
                  }
                }
              }
            }
          } catch (err) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: err.message }) + '\n'))
          } finally {
            reader.releaseLock()
            controller.close()
          }
        },
      })

      return new Response(streamBody, {
        headers: { 'Content-Type': 'text/event-stream', ...CORS_HEADERS },
      })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 4096 },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      return new Response(
        JSON.stringify({ error: `AI provider error: ${response.status}. ${errText.slice(0, 500)}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      )
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const usage = data?.usageMetadata || {}

    return new Response(JSON.stringify({ result: text, type, usage }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `AI request failed: ${err.message}. Please try again.` }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }
})
