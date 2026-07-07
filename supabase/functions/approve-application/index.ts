import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyAuth, requireRole, getCorsHeaders, CORS_HEADERS, checkRateLimit, getRateLimitKey } from '../middleware/auth.ts'

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3
const RETRYABLE_ERROR_PATTERNS = [
  'timeout', 'timed out', 'network', 'econnrefused', 'econnreset',
  'etimedout', 'enotfound', ' 500', ' 502', ' 503', ' 504',
  'rate limit', 'too many requests',
]
const NON_RETRYABLE_CODES = [
  'INVALID_INPUT', 'MISSING_FIELD', 'NOT_FOUND', 'FORBIDDEN',
  'DUPLICATE_EMAIL', 'VALIDATION_ERROR',
]

// ── Helpers ─────────────────────────────────────────────────────────────────────
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+'
  const array = new Uint8Array(20)
  crypto.getRandomValues(array)
  let password = ''
  for (let i = 0; i < 20; i++) {
    password += chars[array[i] % chars.length]
  }
  return password + 'Aa1!'
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ApproveRequest {
  applicationId: string
  idempotencyKey: string
}

interface StepResult {
  success: boolean
  code?: string
  message?: string
  data?: Record<string, unknown>
}

type ProvisioningStep =
  | 'validating'
  | 'creating_auth_user'
  | 'creating_profile'
  | 'updating_application'
  | 'initializing_crm'
  | 'creating_goals'
  | 'creating_conversations'
  | 'sending_email'
  | 'completed'
  | 'rolling_back'
  | 'failed'

const STEP_ORDER: ProvisioningStep[] = [
  'validating',
  'creating_auth_user',
  'creating_profile',
  'updating_application',
  'initializing_crm',
  'creating_goals',
  'creating_conversations',
  'sending_email',
  'completed',
]

interface ProvisioningContext {
  admin: ReturnType<typeof createClient>
  applicationId: string
  idempotencyKey: string
  mentorId: string
  userId: string
  email: string
  fullName: string
  tempPassword: string
  programId: string | null
  focusArea: string | null
  jobId: string
  requestId: string
  completedSteps: ProvisioningStep[]
  audit: AuditLogger
  resendApiKey: string | undefined
}

interface AuditLogger {
  log(action: string, step: ProvisioningStep, status: 'started' | 'completed' | 'failed' | 'rolled_back' | 'retrying' | 'skipped', message?: string, metadata?: Record<string, unknown>): Promise<void>
}

// ── Main Handler ────────────────────────────────────────────────────────────────
serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'approve-application', requestId }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // ── Auth check ──
  const authHeader = req.headers.get('Authorization')
  const { user, error: authError } = await verifyAuth(authHeader)
  if (authError) return authError

  const roleError = requireRole(user, ['mentor'])
  if (roleError) return roleError

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const rateLimitKey = getRateLimitKey('approve-application', user.id, ip)
  const { allowed, retryAfterMs } = await checkRateLimit(rateLimitKey, 'approve-application')
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please wait before approving more applications.', retryAfterMs }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)), ...corsHeaders } },
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return respond(500, 'CONFIG_ERROR', 'Server not configured', 'validating')
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Parse body ──
  let body: ApproveRequest
  try {
    body = await req.json()
  } catch {
    return respond(400, 'INVALID_INPUT', 'Invalid JSON body', 'validating')
  }

  if (!body.applicationId || typeof body.applicationId !== 'string') {
    return respond(400, 'MISSING_FIELD', 'applicationId is required', 'validating')
  }

  // ── Dual-Mode Routing ──
  // Phase 2 mode (no idempotencyKey): simple fallback
  // Phase 3 mode (with idempotencyKey): transactional state machine
  if (!body.idempotencyKey || typeof body.idempotencyKey !== 'string') {
    return await phase2Flow(admin, body, user!, resendApiKey, startTime)
  }

  return await phase3Flow(admin, body, user!, resendApiKey, requestId, startTime)
})

// ── Phase 2 Fallback (no idempotencyKey) ─────────────────────────────────────────
// Simple sequential provisioning without state machine, retry, or audit logging.
// Preserved for backward compatibility when ENABLE_TRANSACTIONAL_PROVISIONING = off.
async function phase2Flow(
  admin: ReturnType<typeof createClient>,
  body: ApproveRequest,
  user: { id: string; email: string; role: string },
  resendApiKey: string | undefined,
  startTime: number,
): Promise<Response> {
  const log = (step: string, status: string, extra: Record<string, unknown> = {}) => {
    admin.from('analytics_events').insert({
      event_type: 'approval_audit',
      properties: { step, status, mentor_id: user.id, application_id: body.applicationId, timestamp: new Date().toISOString(), ...extra },
    }).then(() => {}).catch(() => {})
  }

  log('start', 'started')

  const { data: app, error: appError } = await admin
    .from('applications').select('*').eq('id', body.applicationId).single()

  if (appError || !app) {
    log('fetch_application', 'failed', { error: 'Application not found' })
    return respond(404, 'NOT_FOUND', 'Application not found', 'validating')
  }

  if (app.status === 'invited' || app.status === 'approved') {
    log('idempotency', 'skipped', { reason: `Already ${app.status}` })
    return new Response(
      JSON.stringify({ success: true, code: 'ALREADY_PROCESSED', message: `Application was already ${app.status}`, studentId: app.user_id, email: app.email }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }

  const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim()
  const email = app.email
  const mentorId = user.id

  if (app.mentor_id && app.mentor_id !== mentorId) {
    log('authorization', 'failed', { reason: 'Mentor not authorized' })
    return respond(403, 'FORBIDDEN', 'You are not authorized to approve this application', 'validating')
  }

  const tempPassword = generateSecurePassword()
  let userId: string | null = null

  try {
    log('create_auth_user', 'started')
    const { data: authData, error: authCreateError } = await admin.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
      user_metadata: { full_name: fullName, role: 'student' },
    })
    if (authCreateError || !authData?.user) {
      log('create_auth_user', 'failed', { error: authCreateError?.message })
      return respond(500, 'AUTH_CREATE_FAILED', 'Failed to create user account', 'create_auth_user')
    }
    userId = authData.user.id
    log('create_auth_user', 'completed', { user_id: userId })

    log('create_profile', 'started')
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId, email, name: fullName, role: 'student', application_status: 'approved',
      mentor_id: mentorId, first_name: app.first_name || null, last_name: app.last_name || null,
      status: 'active', health_status: 'active', growth_score: 0,
      metrics: { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 }, tags: [],
    })
    if (profileError) {
      log('create_profile', 'failed', { error: profileError.message })
      await rollbackAuthUser(admin, userId)
      return respond(500, 'PROFILE_CREATE_FAILED', 'Failed to create student profile', 'create_profile')
    }
    log('create_profile', 'completed')

    log('update_application', 'started')
    const { error: updateError } = await admin
      .from('applications').update({ status: 'invited', user_id: userId, mentor_id: mentorId, updated_at: new Date().toISOString() })
      .eq('id', body.applicationId)
    if (updateError) {
      log('update_application', 'failed', { error: updateError.message })
      await rollbackAll(admin, userId, body.applicationId)
      return respond(500, 'APPLICATION_UPDATE_FAILED', 'Failed to update application status', 'update_application')
    }
    log('update_application', 'completed')

    log('initialize_crm', 'started')
    const crmResult = await phase2InitCrm(admin, { userId, email, name: fullName, applicationId: body.applicationId, programId: app.program_id || null, focusArea: app.focus_area || null, mentorId })
    if (!crmResult.success) {
      log('initialize_crm', 'failed', { error: crmResult.message })
      await rollbackAll(admin, userId, body.applicationId)
      return respond(500, 'CRM_INIT_FAILED', crmResult.message || 'CRM initialization failed', 'initialize_crm')
    }
    log('initialize_crm', 'completed')

    log('send_email', 'started')
    const emailResult = await phase2SendEmail(resendApiKey, email, fullName)
    if (!emailResult.success) {
      log('send_email', 'failed', { error: emailResult.message })
    } else {
      log('send_email', 'completed')
    }

    log('complete', 'completed', { user_id: userId })
    return new Response(
      JSON.stringify({ success: true, studentId: userId, email }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  } catch {
    log('unexpected_error', 'failed', { error: 'Unexpected error in phase2Flow' })
    if (userId) await rollbackAll(admin, userId, body.applicationId)
    return respond(500, 'UNEXPECTED_ERROR', 'An unexpected error occurred', 'unknown')
  }
}

async function rollbackAuthUser(admin: ReturnType<typeof createClient>, userId: string): Promise<void> {
  try { await admin.auth.admin.deleteUser(userId) } catch { /* best-effort */ }
}

async function rollbackAll(admin: ReturnType<typeof createClient>, userId: string, applicationId: string): Promise<void> {
  try { await admin.from('profiles').delete().eq('id', userId) } catch {}
  try { await admin.from('student_progress').delete().eq('user_id', userId) } catch {}
  try { await admin.from('dashboard_layouts').delete().eq('user_id', userId) } catch {}
  try { await admin.from('student_timeline_events').delete().eq('student_id', userId) } catch {}
  try { await admin.from('goals').delete().eq('student_id', userId) } catch {}
  try { await admin.from('conversations').delete().eq('student_id', userId) } catch {}
  try { await admin.from('analytics_events').delete().eq('user_id', userId) } catch {}
  try { await admin.from('applications').update({ status: 'pending_review', user_id: null, updated_at: new Date().toISOString() }).eq('id', applicationId) } catch {}
  await rollbackAuthUser(admin, userId)
}

async function phase2InitCrm(
  admin: ReturnType<typeof createClient>,
  params: { userId: string; email: string; name: string; applicationId: string; programId?: string | null; focusArea?: string | null; mentorId: string },
): Promise<{ success: boolean; message?: string }> {
  const { userId, email, name, applicationId, programId, focusArea, mentorId } = params
  const now = new Date().toISOString()
  try {
    const profileUpdates: Record<string, unknown> = { updated_at: now, application_status: 'approved' }
    if (programId) profileUpdates.program_id = programId
    if (focusArea) profileUpdates.specialization = focusArea
    if (Object.keys(profileUpdates).length > 1) {
      await admin.from('profiles').update(profileUpdates).eq('id', userId)
    }

    const { data: existingProgress } = await admin.from('student_progress').select('id').eq('user_id', userId).maybeSingle()
    if (!existingProgress) {
      const { error: progressError } = await admin.from('student_progress').insert({ user_id: userId, program_id: programId, started_at: now, lessons: {} })
      if (progressError) {
        console.error(`[approve] phase2InitCrm progress: ${progressError.message}`)
        return { success: false, message: 'CRM initialization error' }
      }
    }

    const { data: existingDashboard } = await admin.from('dashboard_layouts').select('id').eq('user_id', userId).maybeSingle()
    if (!existingDashboard) {
      const { error: dashboardError } = await admin.from('dashboard_layouts').insert({ user_id: userId, layout: [] })
      if (dashboardError) {
        console.error(`[approve] phase2InitCrm dashboard: ${dashboardError.message}`)
        return { success: false, message: 'CRM initialization error' }
      }
    }

    await admin.from('student_timeline_events').insert({ student_id: userId, type: 'application_approved', title: 'Application Approved', description: `${name} was approved by their mentor.`, timestamp: now, mentor_id: mentorId, category: 'system' })
    await admin.from('student_timeline_events').insert({ student_id: userId, type: 'application_approved', title: 'Student Approved & CRM Initialized', description: `${name} was approved and all CRM records were automatically created.`, timestamp: now, mentor_id: mentorId, category: 'system' })

    const { data: existingGoals } = await admin.from('goals').select('id').eq('student_id', userId).limit(1)
    if (!existingGoals || existingGoals.length === 0) {
      const { error: goalsError } = await admin.from('goals').insert([
        { student_id: userId, title: 'Complete Program Onboarding', description: 'Complete the initial onboarding process to set up your learning journey.', status: 'not_started', progress_percentage: 0 },
        { student_id: userId, title: 'Define Career Goals', description: 'Identify and document your short-term and long-term career objectives.', status: 'not_started', progress_percentage: 0 },
      ])
      if (goalsError) {
        console.error(`[approve] phase2InitCrm goals: ${goalsError.message}`)
        return { success: false, message: 'CRM initialization error' }
      }
    }

    const { data: existingConversation } = await admin.from('conversations').select('id').or(`mentor_id.eq.${mentorId},student_id.eq.${userId}`).limit(1)
    if (!existingConversation || existingConversation.length === 0) {
      const convId = crypto.randomUUID()
      const { error: convError } = await admin.from('conversations').insert({ id: convId, mentor_id: mentorId, student_id: userId, last_message: null, last_message_at: null })
      if (convError) {
        console.error(`[approve] phase2InitCrm conv: ${convError.message}`)
        return { success: false, message: 'CRM initialization error' }
      }
      const { error: partError } = await admin.from('conversation_participants').insert([{ conversation_id: convId, user_id: mentorId }, { conversation_id: convId, user_id: userId }])
      if (partError) {
        console.error(`[approve] phase2InitCrm part: ${partError.message}`)
        return { success: false, message: 'CRM initialization error' }
      }
    }

    await admin.from('analytics_events').insert({ user_id: userId, event_type: 'student_approved', properties: { application_id: applicationId, approved_at: now, name, email, focus_area: focusArea || null, approved_by: mentorId } })
    return { success: true }
  } catch (err) {
    console.error('[approve] phase2InitCrm error:', err)
    return { success: false, message: 'CRM initialization error' }
  }
}

async function phase2SendEmail(resendApiKey: string | undefined, to: string, name: string): Promise<{ success: boolean; message?: string }> {
  if (!resendApiKey) return { success: false, message: 'Resend API key not configured' }
  const safeName = escapeHtml(name)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Mentorino <notifications@mentorino.com>', to: [to], subject: 'Welcome to Mentorino — Your Account Details', html: `<h1>Welcome, ${safeName}!</h1><p>We're excited to have you on board. Your mentor will be in touch soon.</p><p><strong>Email:</strong> ${to}</p><p>To get started, please sign in using the <strong>"Forgot Password"</strong> option on the login page to set your own password.</p><p><a href="https://mentorino.app/login">https://mentorino.app/login</a></p><p>Best,<br/>The Mentorino Team</p>` }),
    })
    const result = await response.json()
    if (!response.ok) {
      console.error(`[approve] phase2SendEmail: status=${response.status}`)
      return { success: false, message: 'Failed to send welcome email' }
    }
    return { success: true }
  } catch (err) {
    console.error('[approve] phase2SendEmail error:', err)
    return { success: false, message: 'Email send error' }
  }
}

// ── Phase 3: State Machine Execution ────────────────────────────────────────────
async function phase3Flow(
  admin: ReturnType<typeof createClient>,
  body: ApproveRequest,
  user: { id: string; email: string; role: string },
  resendApiKey: string | undefined,
  requestId: string,
  startTime: number,
): Promise<Response> {
  // ── Create or retrieve provisioning job ──
  const jobResult = await getOrCreateJob(admin, body.applicationId, body.idempotencyKey, user.id, requestId)
  if (!jobResult.success) {
    return respond(409, 'CONFLICT', jobResult.message || 'Job conflict', 'validating')
  }

  const job = jobResult.job

  // ── Idempotency: if already completed, return cached result ──
  if (job.status === 'completed') {
    return respondOk('ALREADY_PROCESSED', `Application was already processed (completed at ${job.end_time})`, job.result_data?.student_id || '', job.result_data?.email || '')
  }

  // ── If running, reject with conflict ──
  if (job.status === 'running') {
    return respond(409, 'IN_PROGRESS', 'Provisioning is already in progress', 'validating')
  }

  // ── If failed, check retry eligibility ──
  if (job.status === 'failed' || job.status === 'rolled_back') {
    if (job.retry_count >= (job.max_retries || MAX_RETRIES)) {
      return respond(429, 'MAX_RETRIES_EXCEEDED', 'Maximum retry count exceeded. Manual intervention required.', 'validating')
    }
  }

  // ── Mark as running ──
  await admin.from('provisioning_jobs').update({
    status: 'running',
    start_time: new Date().toISOString(),
    retry_count: (job.retry_count || 0) + 1,
    current_step: job.current_step || 'validating',
  }).eq('id', job.id)

  // ── Build context ──
  const ctx: ProvisioningContext = {
    admin,
    applicationId: body.applicationId,
    idempotencyKey: body.idempotencyKey,
    mentorId: user.id,
    userId: '',
    email: '',
    fullName: '',
    tempPassword: generateSecurePassword(),
    programId: null,
    focusArea: null,
    jobId: job.id,
    requestId,
    completedSteps: [],
    audit: {
      log: async (action, step, status, message, metadata = {}) => {
        try {
          await admin.from('provisioning_audit_logs').insert({
            provisioning_job_id: job.id,
            application_id: body.applicationId,
            request_id: requestId,
            mentor_id: user.id,
            action,
            step,
            status,
            message: message || null,
            metadata,
            duration_ms: Date.now() - startTime,
          })
        } catch {
          // Audit log failure must never block provisioning
        }
      },
    },
    resendApiKey,
  }

  // ── Fetch application data ──
  const { data: app, error: appError } = await admin
    .from('applications').select('*').eq('id', body.applicationId).single()

  if (appError || !app) {
    await failJob(ctx, 'validating', 'Application not found', { error: appError?.message })
    return respond(404, 'NOT_FOUND', 'Application not found', 'validating')
  }

  ctx.email = app.email
  ctx.fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim()
  ctx.programId = app.program_id || null
  ctx.focusArea = app.focus_area || null

  // ── Mentor authorization ──
  if (app.mentor_id && app.mentor_id !== ctx.mentorId) {
    await failJob(ctx, 'validating', 'Mentor not authorized', { applicationMentorId: app.mentor_id })
    return respond(403, 'FORBIDDEN', 'You are not authorized to approve this application', 'validating')
  }

  await ctx.audit.log('authorization_checked', 'validating', 'completed')

  // ── State Machine Execution ──
  const startStepIndex = getStartStepIndex(job.current_step)

  for (let i = startStepIndex; i < STEP_ORDER.length; i++) {
    const step = STEP_ORDER[i]
    if (step === 'completed') {
      await completeJob(ctx, startTime)
      return respondOk('SUCCESS', 'Provisioning completed successfully', ctx.userId, ctx.email)
    }

    const result = await executeStep(ctx, step, startTime)
    if (!result.success) {
      if (isRetryableError(result) && (job.retry_count || 0) < (job.max_retries || MAX_RETRIES)) {
        await ctx.audit.log('retry_scheduled', step, 'retrying', result.message)
        await admin.from('provisioning_jobs').update({
          status: 'retrying',
          current_step: step,
          last_error: result.message,
          last_error_detail: { code: result.code, ...result.data },
        }).eq('id', job.id)
        return respond(500, 'RETRYABLE_ERROR', result.message || 'Retryable error', step)
      }

      await executeRollback(ctx, startTime)
      return respond(500, result.code || 'PROVISIONING_FAILED', result.message || 'Provisioning failed', step)
    }
  }

  await completeJob(ctx, startTime)
  return respondOk('SUCCESS', 'Provisioning completed successfully', ctx.userId, ctx.email)
}

// ── State Machine Steps ─────────────────────────────────────────────────────────
async function executeStep(ctx: ProvisioningContext, step: ProvisioningStep, startTime: number): Promise<StepResult> {
  await ctx.audit.log('step_started', step, 'started')
  await updateJobStep(ctx, step)

  let result: StepResult

  switch (step) {
    case 'validating':
      result = { success: true } // Already validated above
      break
    case 'creating_auth_user':
      result = await stepCreateAuthUser(ctx)
      break
    case 'creating_profile':
      result = await stepCreateProfile(ctx)
      break
    case 'updating_application':
      result = await stepUpdateApplication(ctx)
      break
    case 'initializing_crm':
      result = await stepInitializeCrm(ctx)
      break
    case 'creating_goals':
      result = await stepCreateGoals(ctx)
      break
    case 'creating_conversations':
      result = await stepCreateConversations(ctx)
      break
    case 'sending_email':
      result = await stepSendEmail(ctx)
      break
    default:
      result = { success: false, code: 'UNKNOWN_STEP', message: `Unknown step: ${step}` }
  }

  if (result.success) {
    ctx.completedSteps.push(step)
    await ctx.audit.log('step_completed', step, 'completed', undefined, { duration_ms: Date.now() - startTime })
  } else {
    await ctx.audit.log('step_failed', step, 'failed', result.message, { code: result.code, duration_ms: Date.now() - startTime })
  }

  return result
}

async function stepCreateAuthUser(ctx: ProvisioningContext): Promise<StepResult> {
  const { data: authData, error: authCreateError } = await ctx.admin.auth.admin.createUser({
    email: ctx.email,
    password: ctx.tempPassword,
    email_confirm: true,
    user_metadata: { full_name: ctx.fullName, role: 'student' },
  })

  if (authCreateError) {
    if (authCreateError.message?.includes('already exists') || authCreateError.message?.includes('duplicate')) {
      return { success: false, code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' }
    }
    console.error(`[approve] stepCreateAuthUser: ${authCreateError.message}`)
    return { success: false, code: 'AUTH_CREATE_FAILED', message: 'Failed to create user account' }
  }

  if (!authData?.user) {
    return { success: false, code: 'AUTH_CREATE_FAILED', message: 'User creation returned no user' }
  }

  ctx.userId = authData.user.id
  return { success: true, data: { user_id: ctx.userId } }
}

async function stepCreateProfile(ctx: ProvisioningContext): Promise<StepResult> {
  const { error: profileError } = await ctx.admin.from('profiles').upsert({
    id: ctx.userId,
    email: ctx.email,
    name: ctx.fullName,
    role: 'student',
    application_status: 'approved',
    mentor_id: ctx.mentorId,
    first_name: ctx.fullName.split(' ')[0] || null,
    last_name: ctx.fullName.split(' ').slice(1).join(' ') || null,
    status: 'active',
    health_status: 'active',
    growth_score: 0,
    metrics: { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 },
    tags: [],
  })

  if (profileError) {
    console.error(`[approve] stepCreateProfile: ${profileError.message}`)
    return { success: false, code: 'PROFILE_CREATE_FAILED', message: 'Failed to create student profile' }
  }

  return { success: true }
}

async function stepUpdateApplication(ctx: ProvisioningContext): Promise<StepResult> {
  const { error: updateError } = await ctx.admin
    .from('applications')
    .update({
      status: 'invited',
      user_id: ctx.userId,
      mentor_id: ctx.mentorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.applicationId)

  if (updateError) {
    console.error(`[approve] stepUpdateApplication: ${updateError.message}`)
    return { success: false, code: 'APPLICATION_UPDATE_FAILED', message: 'Failed to update application status' }
  }

  return { success: true }
}

async function stepInitializeCrm(ctx: ProvisioningContext): Promise<StepResult> {
  const now = new Date().toISOString()

  try {
    // ── Update profile with program info ──
    const profileUpdates: Record<string, unknown> = { updated_at: now, application_status: 'approved' }
    if (ctx.programId) profileUpdates.program_id = ctx.programId
    if (ctx.focusArea) profileUpdates.specialization = ctx.focusArea

    if (Object.keys(profileUpdates).length > 1) {
      const { error: profileUpdError } = await ctx.admin.from('profiles').update(profileUpdates).eq('id', ctx.userId)
      if (profileUpdError) {
        console.error(`[approve] stepInitializeCrm profile update: ${profileUpdError.message}`)
        return { success: false, code: 'CRM_PROFILE_UPDATE_FAILED', message: 'Failed to update profile' }
      }
    }

    // ── Create student_progress if not exists ──
    const { data: existingProgress } = await ctx.admin
      .from('student_progress').select('id').eq('user_id', ctx.userId).maybeSingle()
    if (!existingProgress) {
      const { error: progressError } = await ctx.admin.from('student_progress').insert({
        user_id: ctx.userId,
        program_id: ctx.programId,
        started_at: now,
        lessons: {},
      })
      if (progressError) {
        console.error(`[approve] stepInitializeCrm progress: ${progressError.message}`)
        return { success: false, code: 'CRM_PROGRESS_FAILED', message: 'Failed to initialize progress tracking' }
      }
    }

    // ── Create dashboard_layout if not exists ──
    const { data: existingDashboard } = await ctx.admin
      .from('dashboard_layouts').select('id').eq('user_id', ctx.userId).maybeSingle()
    if (!existingDashboard) {
      const { error: dashboardError } = await ctx.admin.from('dashboard_layouts').insert({
        user_id: ctx.userId,
        layout: [],
      })
      if (dashboardError) {
        console.error(`[approve] stepInitializeCrm dashboard: ${dashboardError.message}`)
        return { success: false, code: 'CRM_DASHBOARD_FAILED', message: 'Failed to create dashboard layout' }
      }
    }

    // ── Timeline events ──
    const { error: timelineError1 } = await ctx.admin.from('student_timeline_events').insert({
      student_id: ctx.userId,
      type: 'application_approved',
      title: 'Application Approved',
      description: `${ctx.fullName} was approved by their mentor.`,
      timestamp: now,
      mentor_id: ctx.mentorId,
      category: 'system',
    })
    if (timelineError1) {
      console.error(`[approve] stepInitializeCrm timeline1: ${timelineError1.message}`)
      return { success: false, code: 'CRM_TIMELINE_FAILED', message: 'Failed to create timeline event' }
    }

    const { error: timelineError2 } = await ctx.admin.from('student_timeline_events').insert({
      student_id: ctx.userId,
      type: 'application_approved',
      title: 'Student Approved & CRM Initialized',
      description: `${ctx.fullName} was approved and all CRM records were automatically created.`,
      timestamp: now,
      mentor_id: ctx.mentorId,
      category: 'system',
    })
    if (timelineError2) {
      console.error(`[approve] stepInitializeCrm timeline2: ${timelineError2.message}`)
      return { success: false, code: 'CRM_TIMELINE2_FAILED', message: 'Failed to create timeline event' }
    }

    // ── Analytics event ──
    const { error: analyticsError } = await ctx.admin.from('analytics_events').insert({
      user_id: ctx.userId,
      event_type: 'student_approved',
      properties: {
        application_id: ctx.applicationId,
        approved_at: now,
        name: ctx.fullName,
        email: ctx.email,
        focus_area: ctx.focusArea || null,
        approved_by: ctx.mentorId,
      },
    })
    if (analyticsError) {
      console.error(`[approve] stepInitializeCrm analytics: ${analyticsError.message}`)
      return { success: false, code: 'CRM_ANALYTICS_FAILED', message: 'Failed to log analytics event' }
    }

    return { success: true }
  } catch {
    return { success: false, code: 'CRM_INIT_FAILED', message: 'CRM initialization error' }
  }
}

async function stepCreateGoals(ctx: ProvisioningContext): Promise<StepResult> {
  const { data: existingGoals } = await ctx.admin
    .from('goals').select('id').eq('student_id', ctx.userId).limit(1)

  if (!existingGoals || existingGoals.length === 0) {
    const { error: goalsError } = await ctx.admin.from('goals').insert([
      {
        student_id: ctx.userId,
        title: 'Complete Program Onboarding',
        description: 'Complete the initial onboarding process to set up your learning journey.',
        status: 'not_started',
        progress_percentage: 0,
      },
      {
        student_id: ctx.userId,
        title: 'Define Career Goals',
        description: 'Identify and document your short-term and long-term career objectives.',
        status: 'not_started',
        progress_percentage: 0,
      },
    ])
    if (goalsError) {
      console.error(`[approve] stepCreateGoals: ${goalsError.message}`)
      return { success: false, code: 'GOALS_CREATE_FAILED', message: 'Failed to create default goals' }
    }
  }

  return { success: true }
}

async function stepCreateConversations(ctx: ProvisioningContext): Promise<StepResult> {
  const { data: existingConversation } = await ctx.admin
    .from('conversations')
    .select('id')
    .or(`mentor_id.eq.${ctx.mentorId},student_id.eq.${ctx.userId}`)
    .limit(1)

  if (!existingConversation || existingConversation.length === 0) {
    const convId = crypto.randomUUID()
    const { error: convError } = await ctx.admin.from('conversations').insert({
      id: convId,
      mentor_id: ctx.mentorId,
      student_id: ctx.userId,
      last_message: null,
      last_message_at: null,
    })
    if (convError) {
      console.error(`[approve] stepCreateConversations: ${convError.message}`)
      return { success: false, code: 'CONVERSATION_CREATE_FAILED', message: 'Failed to create conversation' }
    }

    const { error: partError } = await ctx.admin.from('conversation_participants').insert([
      { conversation_id: convId, user_id: ctx.mentorId },
      { conversation_id: convId, user_id: ctx.userId },
    ])
    if (partError) {
      console.error(`[approve] stepCreateConversations participants: ${partError.message}`)
      return { success: false, code: 'PARTICIPANTS_CREATE_FAILED', message: 'Failed to add conversation participants' }
    }
  }

  return { success: true }
}

async function stepSendEmail(ctx: ProvisioningContext): Promise<StepResult> {
  if (!ctx.resendApiKey) {
    await ctx.audit.log('email_skipped', 'sending_email', 'skipped', 'Resend API key not configured')
    return { success: true } // Non-blocking — student can use Forgot Password
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ctx.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mentorino <notifications@mentorino.com>',
        to: [ctx.email],
        subject: 'Welcome to Mentorino — Your Account Details',
        html: `
          <h1>Welcome, ${escapeHtml(ctx.fullName)}!</h1>
          <p>We're excited to have you on board. Your mentor will be in touch soon.</p>
          <p><strong>Email:</strong> ${ctx.email}</p>
          <p>To get started, please sign in using the <strong>"Forgot Password"</strong> option on the login page to set your own password.</p>
          <p><a href="https://mentorino.app/login">https://mentorino.app/login</a></p>
          <p>Best,<br/>The Mentorino Team</p>
        `,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      console.error(`[approve] stepSendEmail: status=${response.status}`)
      return { success: false, code: 'EMAIL_SEND_FAILED', message: 'Failed to send welcome email' }
    }

    return { success: true }
  } catch (err) {
    console.error('[approve] stepSendEmail error:', err)
    return { success: false, code: 'EMAIL_SEND_FAILED', message: 'Email send error' }
  }
}

// ── Compensation / Rollback ─────────────────────────────────────────────────────
const ROLLBACK_ORDER: ProvisioningStep[] = [
  'creating_conversations',
  'creating_goals',
  'initializing_crm',
  'updating_application',
  'creating_profile',
  'creating_auth_user',
]

async function executeRollback(ctx: ProvisioningContext, startTime: number): Promise<void> {
  await ctx.audit.log('rollback_started', 'rolling_back', 'started')
  await ctx.admin.from('provisioning_jobs').update({
    status: 'rolling_back',
    current_step: 'rolling_back',
  }).eq('id', ctx.jobId)

  for (const step of ROLLBACK_ORDER) {
    if (!ctx.completedSteps.includes(step)) continue
    await compensate(ctx, step)
  }

  // Restore application status to pending_review
  try {
    await ctx.admin.from('applications').update({
      status: 'pending_review',
      user_id: null,
      updated_at: new Date().toISOString(),
    }).eq('id', ctx.applicationId)
  } catch {
    // Best-effort
  }

  await ctx.admin.from('provisioning_jobs').update({
    status: 'rolled_back',
    current_step: 'failed',
    end_time: new Date().toISOString(),
    execution_time_ms: Date.now() - startTime,
  }).eq('id', ctx.jobId)

  await ctx.audit.log('rollback_completed', 'rolling_back', 'completed', undefined, { duration_ms: Date.now() - startTime })
}

async function compensate(ctx: ProvisioningContext, step: ProvisioningStep): Promise<void> {
  await ctx.audit.log('compensating', step, 'started')

  try {
    switch (step) {
      case 'creating_auth_user':
        if (ctx.userId) {
          await ctx.admin.auth.admin.deleteUser(ctx.userId)
        }
        break

      case 'creating_profile':
        if (ctx.userId) {
          await ctx.admin.from('profiles').delete().eq('id', ctx.userId)
        }
        break

      case 'updating_application':
        // Restore is done in main rollback loop
        break

      case 'initializing_crm':
        if (ctx.userId) {
          await ctx.admin.from('student_progress').delete().eq('user_id', ctx.userId)
          await ctx.admin.from('dashboard_layouts').delete().eq('user_id', ctx.userId)
          await ctx.admin.from('student_timeline_events').delete().eq('student_id', ctx.userId)
          await ctx.admin.from('analytics_events').delete().eq('user_id', ctx.userId)
        }
        break

      case 'creating_goals':
        if (ctx.userId) {
          await ctx.admin.from('goals').delete().eq('student_id', ctx.userId)
        }
        break

      case 'creating_conversations':
        if (ctx.userId) {
          const { data: convs } = await ctx.admin
            .from('conversations').select('id').eq('student_id', ctx.userId)
          if (convs) {
            for (const conv of convs) {
              await ctx.admin.from('conversation_participants').delete().eq('conversation_id', conv.id)
            }
          }
          await ctx.admin.from('conversations').delete().eq('student_id', ctx.userId)
        }
        break
    }
  } catch {
    // Compensation failure must never throw — best-effort cleanup
  }

  await ctx.audit.log('compensated', step, 'completed')
}

// ── Retry Logic ─────────────────────────────────────────────────────────────────
function isRetryableError(result: StepResult): boolean {
  if (NON_RETRYABLE_CODES.includes(result.code || '')) return false
  if (!result.message) return true
  const lowerMsg = result.message.toLowerCase()
  return RETRYABLE_ERROR_PATTERNS.some(pattern => lowerMsg.includes(pattern))
}

function getStartStepIndex(currentStep: string): number {
  const idx = STEP_ORDER.indexOf(currentStep as ProvisioningStep)
  return idx >= 0 ? idx : 0
}

// ── Job Management ──────────────────────────────────────────────────────────────
async function getOrCreateJob(
  admin: ReturnType<typeof createClient>,
  applicationId: string,
  idempotencyKey: string,
  mentorId: string,
  requestId: string,
): Promise<{ success: boolean; job?: any; message?: string }> {
  // Check for existing job
  const { data: existingJobs } = await admin
    .from('provisioning_jobs')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingJobs && existingJobs.length > 0) {
    const job = existingJobs[0]

    // If same idempotency key, return existing
    if (job.idempotency_key === idempotencyKey) {
      return { success: true, job }
    }

    // Different idempotency key for same application
    if (job.status === 'running') {
      return { success: false, message: 'Another provisioning is already in progress' }
    }

    if (job.status === 'completed') {
      return { success: false, message: 'Application already provisioned' }
    }

    // Failed/rolled_back with different key — allow retry with new key
    const { data: newJob, error: createError } = await admin.from('provisioning_jobs').insert({
      application_id: applicationId,
      idempotency_key: idempotencyKey,
      mentor_id: mentorId,
      status: 'pending',
      current_step: 'validating',
      retry_count: 0,
      max_retries: MAX_RETRIES,
    }).select().single()

    if (createError) return { success: false, message: createError.message }
    return { success: true, job: newJob }
  }

  // First attempt — create new job
  const { data: newJob, error: createError } = await admin.from('provisioning_jobs').insert({
    application_id: applicationId,
    idempotency_key: idempotencyKey,
    mentor_id: mentorId,
    status: 'pending',
    current_step: 'validating',
    retry_count: 0,
    max_retries: MAX_RETRIES,
  }).select().single()

  if (createError) return { success: false, message: createError.message }
  return { success: true, job: newJob }
}

async function completeJob(ctx: ProvisioningContext, startTime: number): Promise<void> {
  const now = new Date().toISOString()
  await ctx.admin.from('provisioning_jobs').update({
    status: 'completed',
    current_step: 'completed',
    end_time: now,
    execution_time_ms: Date.now() - startTime,
    student_id: ctx.userId,
    result_data: {
      student_id: ctx.userId,
      email: ctx.email,
      completed_steps: ctx.completedSteps,
    },
  }).eq('id', ctx.jobId)

  await ctx.audit.log('provisioning_completed', 'completed', 'completed', undefined, {
    total_duration_ms: Date.now() - startTime,
    steps_completed: ctx.completedSteps.length,
  })
}

async function failJob(ctx: ProvisioningContext, step: string, error: string, detail?: Record<string, unknown>): Promise<void> {
  await ctx.audit.log('job_failed', step as ProvisioningStep, 'failed', error, detail)
  try {
    await ctx.admin.from('provisioning_jobs').update({
      status: 'failed',
      current_step: step,
      last_error: error,
      last_error_detail: detail || {},
      end_time: new Date().toISOString(),
    }).eq('id', ctx.jobId)
  } catch {
    // Best-effort
  }
}

async function updateJobStep(ctx: ProvisioningContext, step: ProvisioningStep): Promise<void> {
  try {
    await ctx.admin.from('provisioning_jobs').update({
      current_step: step,
      step_order: STEP_ORDER.indexOf(step),
    }).eq('id', ctx.jobId)
  } catch {
    // Best-effort
  }
}

// ── Response Helpers ────────────────────────────────────────────────────────────
function respond(status: number, code: string, message: string, step: string): Response {
  return new Response(
    JSON.stringify({ success: false, code, message, step }),
    { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
  )
}

function respondOk(code: string, message: string, studentId: string, email: string): Response {
  return new Response(
    JSON.stringify({ success: true, code, message, studentId, email }),
    { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
  )
}
