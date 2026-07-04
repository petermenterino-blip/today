

# Mentorino — Coding Standards

Version: 1.0


## 1. Folder Structure

```
src/
  app/              App.tsx, root providers (QueryClientProvider, AuthProvider)
  pages/            Top-level public pages only
    Landing/
    About/
    Auth/
    Apply/
    Programs/
    ...
  routes/           Route configuration, route guards, ProtectedRoute
  components/       Truly shared UI components
    ui/             Layout, Sidebar, Button, Card, Modal, LoadingSpinner, EmptyState, ErrorState
    layout/         Header, Footer, SidebarContainer
  features/         Feature pods (each is self-contained)
    student/        StudentDashboard, StudentGoals, StudentTasks, useStudentDashboard
    mentor/         MentorDashboard, MentorStudentList, MentorSessionCalendar
    goals/          GoalCard, GoalForm, GoalList, useGoals, goalService
    sessions/       SessionCard, SessionList, SessionCalendar, useSessions, sessionService
    journals/       JournalEntry, JournalList, useJournals, journalService
    messaging/      MessageThread, MessageList, MessageBubble, useMessages, messageService
    programs/       ProgramCard, ProgramList, usePrograms, programService
    analytics/      RevenueChart, StudentHealthChart, useAnalytics, analyticsService
    ai/             AIAssistant, AIInsights, useAI, aiService
    auth/           LoginForm, AuthGuard, useAuth, authService
    applications/   ApplicationCard, ApplicationList, useApplications, applicationService
    events/         EventCard, EventForm, EventList, useEvents, eventService
    bookings/       BookingCard, BookingCalendar, useBookings, bookingService
    notifications/  NotificationBell, NotificationList, useNotifications, notificationService
  services/         Domain services only (flattened, feature-owned services stay in features/)
  hooks/            Only cross-feature shared hooks
  types/            Shared TypeScript types/interfaces
  utils/            Shared utilities (dateUtils, progressUtils, toast)
  lib/              External service wrappers (supabase.ts, queryClient.tsx, sentry.ts, posthog.ts)
  constants/        Routes, roles, enums
  supabase/
    migrations/     Numbered SQL migration files
    seed/           Seed SQL files
  edge-functions/   Supabase Edge Functions
    gemini/
    calendar/
    meet/
    resend/
    scheduled/
  docs/             Documentation
```


## 2. Naming Conventions

| Element | Convention | Example | Notes |
|---------|-----------|---------|-------|
| **Files** | PascalCase for components, camelCase for utilities | `MentorDashboard.tsx`, `useGoals.ts`, `dateUtils.ts` | Match export name |
| **Components** | PascalCase | `GoalCard`, `SessionList`, `MentorDashboard` | Named export preferred |
| **Hooks** | `use` prefix + camelCase | `useGoals`, `useSessions`, `useAuth` | |
| **Services** | camelCase + `Service` suffix | `goalService`, `sessionService` | Singular |
| **Functions** | camelCase | `formatDate()`, `calculateHealth()` | |
| **Interfaces** | PascalCase, no `I` prefix | `Goal`, `Session`, `UserProfile` | Not `IGoal` |
| **Types** | PascalCase | `HealthStatus`, `AttendanceStatus` | |
| **Enums** | PascalCase | `GoalStatus`, `SessionType` | |
| **Constants** | `UPPER_SNAKE_CASE` | `DEFAULT_STALE_TIME`, `MAX_FILE_SIZE` | |
| **CSS classes** | Tailwind utility classes | No custom CSS classes | |
| **Database tables** | `snake_case` plural | `profiles`, `goal_milestones` | |
| **Database columns** | `snake_case` | `created_at`, `student_id` | |
| **Git branches** | `kebab-case` | `feat/goal-migration`, `fix/scheduler-date` | |
| **Environment vars** | `UPPER_SNAKE_CASE` | `VITE_SUPABASE_URL` | VITE_ prefix for client |

### 2.1 Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'

// 3. Shared project imports
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'

// 4. Feature imports
import { GoalCard } from '@/features/goals/GoalCard'
import { useGoals } from '@/features/goals/useGoals'

// 5. Types
import type { Goal } from '@/types'
```


## 3. React Standards

### 3.1 Component Structure

```typescript
// Functional component with named export
export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  // Hooks first
  const queryClient = useQueryClient()

  // Callbacks
  const handleComplete = useCallback(() => {
    onUpdate(goal.id, { status: 'completed' })
  }, [goal.id, onUpdate])

  // Render
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="font-bold">{goal.title}</h3>
      <ProgressBar value={goal.progressPercentage} />
      <Button onClick={handleComplete}>Mark Complete</Button>
    </div>
  )
}

// Props interface co-located
interface GoalCardProps {
  goal: Goal
  onUpdate: (id: string, data: Partial<Goal>) => void
}
```

### 3.2 Rules

- One component per file (unless closely related sub-components < 50 lines)
- Props destructured at the function signature
- No `React.FC` — use explicit `interface Props` + function declaration
- No inline styles — Tailwind classes only
- Event handlers prefixed with `handle` (`handleSubmit`, `handleClick`)
- Boolean props use `is`/`has` prefix (`isLoading`, `hasError`)
- Always use `useCallback` for functions passed as props
- Always use `useMemo` for expensive computations

### 3.3 Loading, Empty, Error States

Every data-driven component MUST render all four states:

```typescript
export function GoalList({ studentId }: { studentId: string }) {
  const { data: goals, isLoading, error } = useGoals(studentId)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />
  if (!goals?.length) return <EmptyState message="No goals yet" cta="Create your first goal" />

  return goals.map(goal => <GoalCard key={goal.id} goal={goal} />)
}
```


## 4. TypeScript Standards

### 4.1 Strict Config

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 4.2 Type Definitions

```typescript
// Prefer interfaces for object shapes (they extend better)
export interface Goal {
  id: string
  studentId: string
  title: string
  status: GoalStatus
  progressPercentage: number
  createdAt: string
  updatedAt: string
}

// Prefer types for unions, intersections, and utility types
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'

// Use `interface` for service method parameters
export interface CreateGoalInput {
  title: string
  description?: string
  targetDate?: string
}
```

### 4.3 No `any`

- Never use `any` — use `unknown` and type narrowing instead
- Never use `as` assertions — prefer proper type guards
- Never silence errors with `@ts-ignore` or `@ts-expect-error`

### 4.4 Utility Types

```typescript
// Service return types
type ServiceResponse<T> = { data: T; error: null } | { data: null; error: ServiceError }

interface ServiceError {
  code: string
  message: string
  details?: unknown
}
```


## 5. Service Patterns

### 5.1 Service Interface

```typescript
// src/services/goalService.ts
import { supabase } from '@/lib/supabase'
import type { Goal, CreateGoalInput } from '@/types'

export const goalService = {
  async getAll(studentId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(transformGoal)
  },

  async getById(id: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? transformGoal(data) : null
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        student_id: input.studentId,
        title: input.title,
        description: input.description,
        target_date: input.targetDate,
      })
      .select()
      .single()

    if (error) throw error
    return transformGoal(data)
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return transformGoal(data)
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },
}

// Internal helpers
function transformGoal(data: Record<string, unknown>): Goal {
  return {
    id: data.id as string,
    studentId: data.student_id as string,
    title: data.title as string,
    status: data.status as GoalStatus,
    progressPercentage: data.progress_percentage as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  // Converts camelCase keys to snake_case
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
      value,
    ])
  )
}
```

### 5.2 Service Rules

- Every service method returns typed data (never `any`)
- Every service method throws on error (caller handles with TanStack Query)
- Services never touch React state
- Services never import from features or components
- Service methods use `camelCase` but SQL columns use `snake_case` (transform at boundary)
- Always filter `deleted_at IS NULL` for soft-deleted tables


## 6. TanStack Query Patterns

### 6.1 Query Configuration

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (previously cacheTime)
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,                      // Don't retry mutations
    },
  },
})
```

### 6.2 Query Hook Pattern

```typescript
// src/features/goals/useGoals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalService } from './goalService'
import type { Goal, CreateGoalInput } from '@/types'

const GOALS_KEY = 'goals'

export function useGoals(studentId: string) {
  return useQuery({
    queryKey: [GOALS_KEY, studentId],
    queryFn: () => goalService.getAll(studentId),
    enabled: !!studentId,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalService.create(input),
    onSuccess: (newGoal) => {
      queryClient.invalidateQueries({ queryKey: [GOALS_KEY, newGoal.studentId] })
      toast.success('Goal created')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Goal> }) =>
      goalService.update(id, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [GOALS_KEY] })
      // Also update the cache directly
      queryClient.setQueryData([GOALS_KEY, updated.studentId], (old: Goal[] | undefined) =>
        old?.map(g => g.id === updated.id ? updated : g)
      )
    },
  })
}
```

### 6.3 Mutation Rules

- Mutations call services, never supabase directly
- Always invalidate relevant queries on success
- Use optimistic updates for user-facing mutations (messaging, toggles)
- Show toasts on success and error
- Never use `useEffect` + `useState` for data fetching


## 7. Error Handling

### 7.1 Service Layer Errors

```typescript
// Services throw typed errors
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Usage in service
if (error) throw new AppError('Failed to load goals', 'GOALS_FETCH_ERROR', 500)
```

### 7.2 Component Error Handling

- TanStack Query's `error` property for data errors
- `ErrorBoundary` at app root for uncaught errors
- `try/catch` in event handlers for user-initiated actions
- Show user-friendly error messages via `sonner` toast
- Log errors to Sentry (not console)


## 8. Validation

### 8.1 Frontend Validation

```typescript
// Simple validation (no Zod in client)
function validateGoalInput(input: CreateGoalInput): string | null {
  if (!input.title?.trim()) return 'Title is required'
  if (input.title.length > 200) return 'Title is too long'
  return null
}
```

### 8.2 Edge Function Validation (Server-side)

```typescript
import { z } from 'zod'

const GeminiRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  context: z.object({
    studentId: z.string().uuid(),
  }),
})
```


## 9. Testing Approach

> Note: Testing is not yet implemented. These are the standards to adopt.

| Layer | Tool | Scope |
|-------|------|-------|
| Unit (services) | Vitest | Service methods with mocked Supabase |
| Unit (hooks) | Vitest + React Testing Library | Hook behavior with QueryClientProvider |
| Component | Vitest + RTL | Render, state, user interactions |
| Integration | Playwright | Full user flows |
| RLS Policies | Supabase local + SQL tests | Policy behavior per role |

```typescript
// Service test pattern (future)
import { describe, it, expect, vi } from 'vitest'
import { goalService } from './goalService'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('goalService', () => {
  it('throws when supabase returns error', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    }))

    await expect(goalService.getAll('user-1')).rejects.toThrow('DB error')
  })
})
```


## 10. Documentation Expectations

| Element | Location | Required |
|---------|----------|----------|
| Component Props | TypeScript interface above component | Yes |
| Service methods | JSDoc for public methods | Yes |
| Complex logic | Inline comments | When necessary |
| Hooks | JSDoc: what it returns, query key shape | Yes |
| Types | JSDoc for non-obvious fields | Yes |
| Migration files | SQL comments for intent | Yes |
| Architecture decisions | `docs/` files | Per PR |
| Setup instructions | `README.md` | Yes |


## 11. Git Workflow

| Action | Convention |
|--------|-----------|
| Branch prefix | `feat/`, `fix/`, `docs/`, `refactor/`, `chore/` |
| Commits | Conventional commits: `feat: add goal service`, `fix: handle empty state` |
| PR title | Same as conventional commit |
| PR description | Summary + what changed + testing notes |
| Commits per PR | Prefer squash merge to main |


## 12. Performance Standards

| Rule | Standard |
|------|----------|
| Component size | < 400 lines (extract into sub-components) |
| Service file size | < 300 lines |
| Hook file size | < 150 lines |
| Page bundle size | < 100KB gzipped |
| Lazy loading | All route pages |
| Memoization | Only when proven necessary (profile before adding) |
| Re-renders | No excessive re-renders (use React DevTools profiler) |
| Images | WebP format, lazy loaded, sized appropriately |
