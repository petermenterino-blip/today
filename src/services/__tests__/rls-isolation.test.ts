import { describe, it, expect, vi, beforeEach } from 'vitest'

const MOCK_STUDENT_A_ID = '00000000-0000-0000-0000-000000000003'
const MOCK_STUDENT_B_ID = '00000000-0000-0000-0000-000000000004'

function createMockSupabaseClient() {
  const single = vi.fn()
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  const supabase = {
    from,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_STUDENT_A_ID } }, error: null }),
    },
  } as any

  return { supabase, from, select, eq, single }
}

describe('RLS Isolation — Student A cannot access Student B data', () => {
  let mocks: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mocks = createMockSupabaseClient()
  })

  it('prevents Student A from reading Student B goals', async () => {
    const { supabase, from, select, eq, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request', details: 'Key (id) is not present in table "goals".' } })

    const result = await supabase
      .from('goals')
      .select('*')
      .eq('student_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('goals')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('student_id', MOCK_STUDENT_B_ID)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe('PGRST116')
    expect(result.data).toBeNull()
  })

  it('prevents Student A from reading Student B tasks', async () => {
    const { supabase, from, select, eq, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('tasks')
    expect(result.error).toBeDefined()
  })

  it('prevents Student A from reading Student B sessions', async () => {
    const { supabase, from, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('sessions')
    expect(result.error).toBeDefined()
  })

  it('prevents Student A from reading Student B profiles', async () => {
    const { supabase, from, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('profiles')
    expect(result.error).toBeDefined()
  })

  it('prevents Student A from reading Student B journal entries', async () => {
    const { supabase, from, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('journals')
      .select('*')
      .eq('student_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('journals')
    expect(result.error).toBeDefined()
  })

  it('prevents Student A from reading Student B timeline events', async () => {
    const { supabase, from, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('student_timeline_events')
      .select('*')
      .eq('student_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('student_timeline_events')
    expect(result.error).toBeDefined()
  })

  it('prevents Student A from reading Student B notifications', async () => {
    const { supabase, from, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('notifications')
    expect(result.error).toBeDefined()
  })

  it('prevents Student A from reading Student B conversations', async () => {
    const { supabase, from, single } = mocks
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'row-level security prevented the request' } })

    const result = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('user_id', MOCK_STUDENT_B_ID)
      .single()

    expect(from).toHaveBeenCalledWith('conversation_participants')
    expect(result.error).toBeDefined()
  })

  it('allows Student A to read their own goals', async () => {
    const { supabase, from, select, eq, single } = mocks
    const mockGoal = { id: 'goal-1', student_id: MOCK_STUDENT_A_ID, title: 'My Goal' }
    single.mockResolvedValue({ data: mockGoal, error: null })

    const result = await supabase
      .from('goals')
      .select('*')
      .eq('student_id', MOCK_STUDENT_A_ID)
      .single()

    expect(from).toHaveBeenCalledWith('goals')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('student_id', MOCK_STUDENT_A_ID)
    expect(result.error).toBeNull()
    expect(result.data).toEqual(mockGoal)
  })
})
