import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthUser {
  id: string
  email: string
  role: 'student' | 'mentor'
}

export async function verifyAuth(
  authHeader: string | null
): Promise<{ user: AuthUser; error: null } | { user: null; error: Response }> {
  if (!authHeader) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }),
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseKey) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }),
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      role: profile?.role ?? 'student',
    },
    error: null,
  }
}

export function requireRole(
  user: AuthUser | null,
  allowedRoles: string[]
): Response | null {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  if (!allowedRoles.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  return null
}

const ALLOWED_ORIGINS = [
  'https://mentorino.app',
  'https://www.mentorino.app',
  'https://mentorino.vercel.app',
  'https://today-ten-zeta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://mentorino.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowed }
}

// ── DB-backed rate limiter ─────────────────────────────────────
// Uses Supabase `rate_limits` table instead of in-memory Map,
// which is reliable across serverless instances.
const RATE_LIMIT_CONFIG: Record<string, { maxRequests: number; windowMs: number }> = {
  gemini: { maxRequests: 30, windowMs: 60000 },
  resend: { maxRequests: 10, windowMs: 60000 },
  'approve-application': { maxRequests: 5, windowMs: 60000 },
  scheduled: { maxRequests: 2, windowMs: 60000 },
  'resend-public': { maxRequests: 5, windowMs: 60000 },
  default: { maxRequests: 60, windowMs: 60000 },
}

export function getRateLimitKey(functionName: string, userId: string, ip: string): string {
  return `${functionName}:${userId || ip}`
}

export async function checkRateLimit(key: string, functionName: string): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const config = RATE_LIMIT_CONFIG[functionName] || RATE_LIMIT_CONFIG.default

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseKey) {
    return { allowed: true, retryAfterMs: 0 }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const now = new Date()

  const { data } = await supabase
    .from('rate_limits')
    .select('count, expires_at')
    .eq('key', key)
    .maybeSingle()

  if (!data || new Date(data.expires_at) < now) {
    await supabase.from('rate_limits').upsert({
      key,
      count: 1,
      expires_at: new Date(now.getTime() + config.windowMs).toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'key' })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (data.count >= config.maxRequests) {
    const retryAfterMs = new Date(data.expires_at).getTime() - now.getTime()
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) }
  }

  await supabase.from('rate_limits').update({
    count: data.count + 1,
    updated_at: now.toISOString(),
  }).eq('key', key)

  return { allowed: true, retryAfterMs: 0 }
}

export async function checkPublicRateLimit(ip: string, functionName: string): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const key = `public:${functionName}:${ip}`
  return checkRateLimit(key, `${functionName}-public`)
}
