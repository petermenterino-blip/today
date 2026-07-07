# Test Strategy

## Principles

1. **Test behavior, not implementation** — Mock external dependencies (Supabase, network), test business logic outcomes.
2. **Security first** — Authentication, authorization, and data isolation get highest priority.
3. **No production code changes** — Tests must pass against existing code. Bug fixes require separate approval.
4. **Incremental coverage** — Target high-value files first, then expand to lower-priority areas.

## Test Architecture

| Layer | Tool | Scope |
|-------|------|-------|
| Unit (services, utils, lib) | Vitest + jsdom | Pure logic, mocked Supabase |
| Component (React) | Vitest + RTL + jsdom | Rendering, user interactions |
| E2E | Playwright | Full user flows with staging |
| Edge Functions | Deno test (future) | Serverless logic |

## Mock Strategy

- **Services**: `vi.mock()` at module level with `vi.hoisted()` mock factories
- **Supabase client**: Mock `@/src/lib/supabase` with controlled response methods
- **Auth state**: Capture `onAuthStateChange` callbacks in arrays for manual event triggering
- **Environment**: `vi.stubEnv()` per test for `VITE_*` variables
- **Console/sessionStorage**: `vi.spyOn()` for logger output verification

## Patterns

### Service Test Pattern
```
vi.hoisted() → create mock functions
vi.mock() → replace module with hoisted mocks
beforeEach → clear mocks, set default env
test → arrange mock responses, call service method, assert result
```

### Component Test Pattern
```
vi.mock() → mock dependencies at module level
render() → wrap in MemoryRouter + AuthProvider
waitFor → wait for async initialization
userEvent → simulate interactions
assert → verify DOM state changes
```

## Priority Queue

1. ~~Authentication~~ ✅ (authService, AuthContext)
2. ~~Authorization~~ ✅ (ProtectedRoute, RLS isolation)
3. ~~Core utilities~~ ✅ (errorHandler, logger, envValidator)
4. Edge functions (blocked — needs Deno test runner)
5. Service layer (event, messaging, resource services)
6. Custom hooks (useGoals, useTasks, etc.)
7. Page components (Landing, Dashboard, etc.)
8. Database migrations (RLP policies, triggers)

## Running Tests

```bash
npm test              # Run all unit tests
npm run test:coverage # Run with coverage report
npm run test:e2e      # Run Playwright E2E tests
```

## Current Test Suite

- **Unit tests**: 160 tests, 12 files, all passing
- **E2E tests**: 80 tests, 10 files, require staging env
- **Total**: 240 tests across 22 files
