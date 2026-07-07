import { applicationService } from '../applicationService'

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}))

let mockFeatures: { edgeApproval: boolean; transactionalProvisioning: boolean }

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    functions: { invoke: mockInvoke },
    auth: { signUp: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(),
          maybeSingle: vi.fn(),
        })),
        single: vi.fn(),
        limit: vi.fn(),
        maybeSingle: vi.fn(),
      })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      delete: vi.fn(() => ({ eq: vi.fn() })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

vi.mock('../../config/features', () => ({
  features: {
    get edgeApproval() { return mockFeatures.edgeApproval },
    get transactionalProvisioning() { return mockFeatures.transactionalProvisioning },
  },
}))

describe('approveApplicationViaEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFeatures = {
      edgeApproval: true,
      transactionalProvisioning: false,
    }
  })

  // ── Phase 2: Simple Edge Function (no idempotencyKey) ──

  it('approves application successfully via Edge Function (Phase 2)', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, studentId: 'student-1', email: 'test@mentorino.com' },
      error: null,
    })

    const result = await applicationService.approveApplication('app-1')

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.email).toBe('test@mentorino.com')
    expect(mockInvoke).toHaveBeenCalledWith('approve-application', {
      body: { applicationId: 'app-1' },
    })
  })

  it('returns error when Edge Function returns failure', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: false, code: 'AUTH_CREATE_FAILED', message: 'Failed to create user account' },
      error: null,
    })

    const result = await applicationService.approveApplication('app-1')

    expect(result.error).toBe('Failed to create user account')
    expect(result.data).toBeNull()
  })

  it('returns error when Edge Function throws', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))

    const result = await applicationService.approveApplication('app-1')

    expect(result.error).toBe('Network error')
    expect(result.data).toBeNull()
  })

  it('returns generic error when Edge Function returns no message', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: false },
      error: null,
    })

    const result = await applicationService.approveApplication('app-1')

    expect(result.error).toBe('Approval failed')
    expect(result.data).toBeNull()
  })

  it('returns error on invoke failure', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Function not found' },
    })

    const result = await applicationService.approveApplication('app-1')

    expect(result.error).toBe('Function not found')
    expect(result.data).toBeNull()
  })

  it('handles already processed response (Phase 2)', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, code: 'ALREADY_PROCESSED', message: 'Application was already approved', studentId: 'student-1', email: 'test@mentorino.com' },
      error: null,
    })

    const result = await applicationService.approveApplication('app-1')

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.email).toBe('test@mentorino.com')
  })

  // ── Phase 3: Transactional Provisioning (with idempotencyKey) ──

  describe('transactional provisioning', () => {
    beforeEach(() => {
      mockFeatures.transactionalProvisioning = true
    })

    it('sends idempotencyKey when transactional provisioning is enabled', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true, code: 'SUCCESS', studentId: 'student-1', email: 'test@mentorino.com' },
        error: null,
      })

      const result = await applicationService.approveApplication('app-1')

      expect(result.error).toBeNull()
      expect(result.data).not.toBeNull()
      expect(mockInvoke).toHaveBeenCalledWith('approve-application', {
        body: { applicationId: 'app-1', idempotencyKey: expect.stringContaining('app-1_') },
      })
    })

    it('handles ALREADY_PROCESSED from transactional provisioning', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true, code: 'ALREADY_PROCESSED', message: 'Application was already processed', studentId: 'student-1', email: 'test@mentorino.com' },
        error: null,
      })

      const result = await applicationService.approveApplication('app-1')

      expect(result.error).toBeNull()
      expect(result.data!.email).toBe('test@mentorino.com')
    })

    it('handles IN_PROGRESS conflict', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, code: 'IN_PROGRESS', message: 'Provisioning is already in progress' },
        error: null,
      })

      const result = await applicationService.approveApplication('app-1')

      expect(result.error).toBe('Provisioning is already in progress')
    })

    it('handles MAX_RETRIES_EXCEEDED', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, code: 'MAX_RETRIES_EXCEEDED', message: 'Maximum retry count exceeded. Manual intervention required.' },
        error: null,
      })

      const result = await applicationService.approveApplication('app-1')

      expect(result.error).toBe('Maximum retry count exceeded. Manual intervention required.')
    })

    it('handles RETRYABLE_ERROR', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, code: 'RETRYABLE_ERROR', message: 'Email send failed', step: 'sending_email' },
        error: null,
      })

      const result = await applicationService.approveApplication('app-1')

      expect(result.error).toBe('Email send failed')
    })

    it('handles ROLLED_BACK state', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, code: 'PROVISIONING_FAILED', message: 'Provisioning failed', step: 'creating_profile' },
        error: null,
      })

      const result = await applicationService.approveApplication('app-1')

      expect(result.error).toBe('Provisioning failed')
    })
  })
})
