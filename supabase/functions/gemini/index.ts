import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { verifyAuth, requireRole, getCorsHeaders, CORS_HEADERS, checkRateLimit, getRateLimitKey } from '../middleware/auth.ts'

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

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
]

function stripPII(obj: unknown): unknown {
  if (typeof obj === 'string') {
    let s = obj
    for (const p of PII_PATTERNS) s = s.replace(p, '[REDACTED]')
    return s
  }
  if (Array.isArray(obj)) return obj.map(stripPII)
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = stripPII(v)
    }
    return result
  }
  return obj
}

function buildContents(systemPrompt: string, messages: { role: string; content: string }[] | undefined, userPrompt: string, context: any) {
  const sanitizedContext = context ? stripPII(context) : null
  const contextBlock = sanitizedContext ? `\n\nContext:\n${JSON.stringify(sanitizedContext, null, 2).slice(0, 20000)}` : ''
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
  const corsHeaders = getCorsHeaders(req)
  const startTime = Date.now()

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'gemini' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const authHeader = req.headers.get('Authorization')
  const { user, error } = await verifyAuth(authHeader)
  if (error) return error

  const roleError = requireRole(user, ['student', 'mentor'])
  if (roleError) return roleError

  const rateKey = getRateLimitKey('gemini', user.id, req.headers.get('x-forwarded-for') || '')
  const { allowed, retryAfterMs } = await checkRateLimit(rateKey, 'gemini')
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)), ...corsHeaders } },
    )
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI service is not configured. Please contact a mentor to set up the GEMINI_API_KEY.' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  try {
    const { prompt, context, type, messages, systemPrompt: customSystem, stream, temperature, maxTokens } = await req.json()

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'prompt is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }
    if (messages !== undefined && !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages must be an array if provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const systemPrompt = customSystem || SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat
    const contents = buildContents(systemPrompt, messages, prompt, context)

    const isStreaming = stream === true

    const geminiHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey }

    if (isStreaming) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: geminiHeaders,
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 4096 },
          }),
        },
      )

      if (!response.ok) {
        const errText = await response.text()
        console.error(`[gemini] streaming API error: ${response.status} ${errText.slice(0, 500)}`)
        return new Response(
          JSON.stringify({ error: 'AI provider error. Please try again later.' }),
          { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
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
          } catch (streamError) {
            console.error('[gemini] stream error:', streamError)
            controller.enqueue(encoder.encode(JSON.stringify({ error: 'AI response error' }) + '\n'))
          } finally {
            reader.releaseLock()
            controller.close()
          }
        },
      })

      return new Response(streamBody, {
        headers: { 'Content-Type': 'text/event-stream', ...corsHeaders },
      })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: geminiHeaders,
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 4096 },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[gemini] API error: ${response.status} ${errText.slice(0, 500)}`)
      return new Response(
        JSON.stringify({ error: 'AI provider error. Please try again later.' }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const usage = data?.usageMetadata || {}
    console.log(`[gemini] success: type=${type} userId=${user.id.slice(0, 8)} duration=${Date.now() - startTime}ms`)

    return new Response(JSON.stringify({ result: text, type, usage }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[gemini] handler error:', err)
    return new Response(
      JSON.stringify({ error: 'AI request failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
