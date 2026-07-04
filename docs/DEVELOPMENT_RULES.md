

# Mentorino — Development Rules

Version: 1.0


## 1. Non-Negotiable Engineering Rules

### Rule 1 — Never Build Custom Authentication

```
FORBIDDEN:
  ❌ Custom password hashing
  ❌ Custom session tokens
  ❌ Manual JWT generation
  ❌ localStorage-based auth persistence

MANDATORY:
  ✅ Supabase Auth only
  ✅ supabase.auth.signInWithPassword()
  ✅ supabase.auth.onAuthStateChange()
  ✅ Memory-only session (no localStorage)
```

### Rule 2 — Never Bypass the Service Layer

```
FORBIDDEN:
  ❌ supabase.from('table').select() in components
  ❌ supabase.from('table').insert() in hooks
  ❌ Direct Supabase calls outside src/services/ or src/features/*/services/

MANDATORY:
  ✅ Components → Hooks → Services → Supabase
  ✅ Every domain has a service file
  ✅ Services are the ONLY files that import supabase client
```

### Rule 3 — Never Expose Secrets to the Browser

```
FORBIDDEN:
  ❌ GEMINI_API_KEY in .env or Vite env vars
  ❌ SUPABASE_SERVICE_ROLE_KEY in client code
  ❌ RESEND_API_KEY in frontend
  ❌ GOOGLE_CLIENT_SECRET in frontend
  ❌ Stripe secret keys in frontend

MANDATORY:
  ✅ Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client
  ✅ All other secrets in Supabase Edge Function Deno.env
  ✅ Service role key used ONLY in Edge Functions / server context
```

### Rule 4 — Never Call AI APIs from the Frontend

```
FORBIDDEN:
  ❌ fetch('https://generativelanguage.googleapis.com/...') from browser
  ❌ Direct Google Gemini SDK in React components
  ❌ AI API keys anywhere in client bundle

MANDATORY:
  ✅ All AI calls through Supabase Edge Function
  ✅ supabase.functions.invoke('gemini', { body })
  ✅ Edge Function validates JWT before forwarding to Gemini
  ✅ Edge Function caches AI responses in database
```

### Rule 5 — Always Use Row Level Security

```
FORBIDDEN:
  ❌ Relying on frontend role checks for authorization
  ❌ Hiding UI elements as sole security measure
  ❌ Client-side data filtering for access control

MANDATORY:
  ✅ All tables have RLS enabled
  ✅ RLS policies use auth.uid() for user identification
  ✅ RLS policies use helper functions (auth.is_mentor(), etc.)
  ✅ Frontend role checks are UX-only, never security boundaries
```

### Rule 6 — Never Duplicate Business Logic

```
FORBIDDEN:
  ❌ Same calculation spread across multiple files
  ❌ Duplicate seed data definitions
  ❌ Multiple services doing the same thing (taskService + taskStorage)

MANDATORY:
  ✅ Business logic in services only
  ✅ Utility functions in utils/ for reusable calculations
  ✅ One service per domain
  ✅ Remove duplicate services (always consolidate)
```

### Rule 7 — Always Optimize for Free Tiers

```
Every feature MUST pass the free tier check:
  ✅ Does this fit within Supabase Free limits?
  ✅ Does this fit within Vercel Free limits?
  ✅ Does this fit within PostHog Free limits?
  ✅ Does this minimize Edge Function executions?
  ✅ Does this minimize database reads?
  ✅ Does this minimize storage usage?

HARD LIMITS:
  - Supabase DB: 2GB max
  - Supabase Storage: 1GB max (lower than 5GB actual limit, for safety margin)
  - Supabase Edge Functions: 2 always-on, 500K invocations/month
  - Vercel bandwidth: 100GB/month
  - PostHog events: 1M/month
  - Sentry events: 5K/month
  - Resend emails: 100/day (free tier)
```

### Rule 8 — Always Write Modular Code

```
MANDATORY:
  ✅ One component per file (< 400 lines)
  ✅ One service per domain
  ✅ One hook per logical concern
  ✅ Props interfaces co-located with component
  ✅ Feature pods include all related files

BREAK UP WHEN:
  - A file exceeds 400 lines → extract sub-components
  - A hook exceeds 150 lines → split by concern
  - A service exceeds 300 lines → split by entity
```


## 2. Architecture Rules

### 2.1 Serverless Only

```
NEVER INTRODUCE:
  Express, Node.js server, NestJS, Fastify, Hono
  Django, Laravel, Spring Boot, ASP.NET
  Docker, Kubernetes, EC2, VPS, any dedicated server

ALLOWED:
  React SPA (Vite build → static files)
  Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
  Vercel (static hosting, optional serverless functions)
```

### 2.2 Data Flow

```
React Component
  ↓ (calls)
Custom Hook (TanStack Query)
  ↓ (calls)
Service Method
  ↓ (calls)
Supabase Client (JWT-authenticated)
  ↓
PostgreSQL (RLS-enforced)

NEVER:
  Component → supabase.from()
  Hook → supabase.from()
  Component → direct fetch()
```

### 2.3 State Management

| State Type | Tool | Rule |
|-----------|------|------|
| Server data | TanStack Query | Always, never useState for fetched data |
| Auth state | React Context | AuthProvider wrapping entire app |
| UI state | React useState | Local to component only |
| Global UI state | Zustand | Only for truly global state (sidebar, theme) |
| Form state | React useState or refs | No form libraries until proven necessary |


## 3. Code Rules

### 3.1 TypeScript Strictness

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true
  }
}
```

- `any` is FORBIDDEN. Use `unknown` and narrow.
- `as` assertions are FORBIDDEN. Use type guards.
- `@ts-ignore` and `@ts-expect-error` are FORBIDDEN.
- All function parameters must be typed.
- All service return types must be explicitly typed.

### 3.2 React Component Rules

- No class components (functional only)
- No `React.FC` (use explicit interface + function declaration)
- No inline styles (Tailwind only)
- No `useEffect` for data fetching (TanStack Query only)
- No prop drilling beyond 2 levels (compose or pass component)
- No giant JSX return statements (extract into sub-components)

### 3.3 Import Rules

- Use `@/` path alias for all project imports
- Import types with `import type` syntax
- Group imports: React → third-party → project → types
- No circular imports (use shared types to break cycles)


## 4. Database Rules

### 4.1 Schema Rules

- All PKs are `UUID DEFAULT gen_random_uuid()`
- All FKs reference `auth.users` or `profiles` with CASCADE
- All tables have `created_at` and `updated_at`
- Soft delete uses `deleted_at TIMESTAMPTZ`
- Every FK column has an index
- Every status/type column has an index
- Use CHECK constraints for enum-like columns

### 4.2 Migration Rules

- One numbered file per logical change
- Never edit a published migration (create a new one)
- Each migration is idempotent (uses `IF NOT EXISTS`, `OR REPLACE`)
- RLS policies are in a single migration file (`999_rls.sql`)
- Auth triggers are in a single migration file (`900_auth_triggers.sql`)
- Test migrations against local Supabase before committing

### 4.3 Query Rules

- Always filter `deleted_at IS NULL` for soft-deleted tables
- Always use RLS (never bypass with service_role in client)
- Use `.single()` when expecting one row
- Use `.maybeSingle()` when expecting zero or one row
- Never SELECT * from large tables without LIMIT
- Use pagination for list views (`.range()`)


## 5. Edge Function Rules

### 5.1 When to Use Edge Functions

```
REQUIRED (use Edge Function):
  ✅ AI calls (Gemini API)
  ✅ Email sending (Resend API)
  ✅ Google Calendar integration
  ✅ Google Meet link creation
  ✅ Scheduled jobs (reminders, cleanup)
  ✅ Admin operations needing service_role

FORBIDDEN (don't use Edge Function):
  ❌ Simple CRUD operations
  ❌ Fetching records
  ❌ Updating student profiles
  ❌ Reading lists
  ❌ Any operation that RLS can handle
```

### 5.2 Edge Function Security

```typescript
// Every Edge Function MUST:
const authorization = req.headers.get('Authorization')
const { data: { user }, error } = await supabase.auth.getUser(authorization)
if (error || !user) return new Response('Unauthorized', { status: 401 })
```

- All Edge Functions validate JWT before processing
- All Edge Functions validate input body shape via Zod
- No Edge Function uses anon key for database operations
- Edge Functions that need DB access use service_role (inside Deno.env only)
- Rate limiting applied per user per function


## 6. Security Rules

### 6.1 RLS Enforcement

- All 30 tables have RLS enabled (enforced in CI)
- No table has `FORCE RLS OFF` in production
- New migrations adding tables MUST include RLS policies
- RLS policies tested with both authenticated and unauthenticated roles

### 6.2 Environment Variables

- `VITE_` prefix ONLY for variables safe to expose to client
- `.env.local` in `.gitignore` — never committed
- `.env.example` has placeholder values only
- Production secrets set via `vercel env add` and `supabase secrets set`
- No secrets in code comments, logs, or error messages

### 6.3 Input Validation

- Client-side: basic form validation (required fields, length, format)
- Server-side (Edge Functions): Zod schema validation on ALL inputs
- Database: CHECK constraints, NOT NULL, column types
- File uploads: type + size check client-side AND server-side
- SQL injection: prevented by Supabase client (parameterized queries)


## 7. Performance Rules

### 7.1 Bundle Size

- Every route page is lazy-loaded (`React.lazy` + `Suspense`)
- No library import exceeds 50KB gzipped
- Monitor bundle with `vite-plugin-visualizer`
- Tree-shake unused imports

### 7.2 Database Performance

- All FK columns indexed
- All query-filtered columns indexed (status, type, date)
- Use pagination for lists over 50 items
- Use TanStack Query `staleTime` to avoid redundant fetches
- Avoid N+1 queries (use Supabase `select(*, relation:...)` joins)

### 7.3 Edge Function Performance

- AI responses cached in database (avoid duplicate Gemini calls)
- Edge Functions warm-up kept under 500ms
- No synchronous external API calls in series (parallelize where possible)
- Use Deno's `cache` API for repeated computations


## 8. Migration Rules

### 8.1 localStorage → Supabase Migration

```
Phase Order (STRICT):
  Phase 1: Supabase Project + Schema (no code changes)
  Phase 2: Auth + Base Service
  Phase 3: Service Migration (one domain at a time)
  Phase 4: Edge Functions
  Phase 5: Folder Restructure (can parallel with 6-8)
  Phase 6: TanStack Query Adoption
  Phase 7: Storage Migration
  Phase 8: Realtime Subscriptions
  Phase 9: Monitoring
  Phase 10: Production Readiness
  Phase 11: Cleanup

Each phase must produce a working build.
No phase can start until the previous phase is complete and tested.
```

### 8.2 Service Migration Pattern (Per Domain)

```
1. Create Supabase implementation (same interface as localStorage version)
2. Swap import in consuming hook
3. Update hook to use TanStack Query
4. Test all pages that consume the hook
5. Remove localStorage code for that domain
6. Remove corresponding MENTORINO_* localStorage key
7. Verify build passes
```

### 8.3 Folder Restructure Pattern (Per File)

```
1. Create target directory
2. Move file (no content change)
3. Update all import paths
4. Verify build passes
5. Delete old file
```


## 9. Git Rules

### 9.1 Branch Strategy

```
main (production, protected)
  └── develop (staging, protected)
       ├── feat/phase-1-schema
       ├── feat/goal-service
       └── fix/scheduler-date-bug
```

### 9.2 Commit Convention

```
feat: add goal service with Supabase integration
fix: correct timezone offset in scheduler
docs: update backup strategy documentation
refactor: extract mentor stats into sub-components
chore: update dependencies
```

### 9.3 PR Rules

- Every PR targets a phase or a domain
- One logical change per PR
- PR description includes: what changed, why, testing notes
- Build must pass before merge
- No PR larger than 500 lines changed (enforced in CI v2)


## 10. Documentation Rules

### 10.1 What Must Be Documented

- All service methods (JSDoc for public interface)
- All custom hooks (JSDoc: what it fetches, query key)
- All complex business logic (inline comments)
- All RLS policies (in migration file comments)
- All environment variables (in .env.example)
- All architecture decisions (in docs/)

### 10.2 What Must NOT Be Documented

- Obvious code (don't comment what the code says)
- Secrets or passwords
- Personal information


## 11. The Mentorino Checklist

Before every commit, ask:

1. Does this follow the serverless architecture?
2. Does this work within free-tier limits?
3. Does this avoid unnecessary complexity?
4. Does this preserve the service-layer architecture?
5. Does this improve maintainability?
6. Is this secure by default?
7. Can this scale to 1,000 students?
8. Can this be migrated later without major rewrites?
9. Does this use TanStack Query for data fetching?
10. Does this use RLS for authorization (not frontend checks)?

If the answer to any is **No**, redesign before committing.
