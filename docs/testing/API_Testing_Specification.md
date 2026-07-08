# API / Data Layer Testing Specification

| Document ID | QA-API-007 |
|---|---|
| Document Title | API / Data Layer Testing Specification |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Supabase SDK + Edge Functions architecture |

---

## 1. Introduction

Mentorino has **no traditional REST API layer**. All data access is performed via three patterns:

1. **Supabase JavaScript SDK (PostgREST)** — `supabase.from('table').select()`, `.insert()`, `.update()`, `.delete()`
2. **Supabase Edge Functions** — `supabase.functions.invoke('name', {body: {...}})` for server-side logic
3. **Supabase Storage** — `supabase.storage.from('bucket').upload()` / `.download()` / `.list()` / `.remove()`
4. **Supabase Auth** — `supabase.auth.signInWithPassword()`, `.signUp()`, `.resetPasswordForEmail()`
5. **Supabase Realtime** — `supabase.channel('name').on('postgres_changes', ...)`

This document covers testing for all five patterns.

---

## 2. Scope

| Layer | Coverage | Testing Tool |
|-------|----------|-------------|
| Supabase PostgREST Queries | All 42+ tables — CRUD, filtering, pagination, joins | Vitest + MSW / Playwright |
| Supabase Edge Functions | `approve-application`, `gemini`, `resend` | Vitest + MSW |
| Supabase Storage | 7 buckets — upload, download, list, delete | Playwright |
| Supabase Auth | signInWithPassword, signUp, resetPassword, getSession | Playwright |
| Supabase Realtime | Channel subscriptions, postgres_changes events | Playwright (currently skipped) |

---

## 3. Supabase SDK Testing Patterns

### 3.1 PostgREST Query Patterns

| Operation | Supabase SDK Call | Expected Return |
|-----------|------------------|-----------------|
| Select all | `supabase.from('table').select('*')` | `{data: T[], error: null}` |
| Select single | `supabase.from('table').select('*').eq('id', val).single()` | `{data: T, error: null}` or `{data: null, error}` |
| Select with filter | `supabase.from('table').select('*').eq('column', val)` | `{data: T[], error: null}` |
| Select with multiple filters | `supabase.from('table').select('*').eq('c1', v1).neq('c2', v2)` | `{data: T[], error: null}` |
| Select with range (pagination) | `supabase.from('table').select('*').range(0, 9)` | `{data: T[], error: null}` |
| Select with count | `supabase.from('table').select('*', {count: 'exact', head: true})` | `{data: null, count: number, error: null}` |
| Select with join | `supabase.from('table').select('*, related_table(*)')` | `{data: T[], error: null}` |
| Insert | `supabase.from('table').insert({...}).select().single()` | `{data: T, error: null}` |
| Update | `supabase.from('table').update({...}).eq('id', val).select().single()` | `{data: T, error: null}` |
| Delete | `supabase.from('table').delete().eq('id', val)` | `{data: [], error: null}` |
| Upsert | `supabase.from('table').upsert({...}).select().single()` | `{data: T, error: null}` |

### 3.2 Response Handling

```typescript
// Standard pattern tested by all data layer tests
const { data, error } = await supabase
  .from('goals')
  .select('*')
  .eq('student_id', userId)

if (error) {
  // Handle error — should display toast, not crash
  console.error('Failed to fetch goals:', error.message)
  return
}

// data is typed array — handle empty case
if (!data || data.length === 0) {
  // Show empty state
}
```

### 3.3 Error Patterns

| Error Scenario | Supabase Response | UI Handling |
|---------------|------------------|-------------|
| Network failure | `{data: null, error: {message: "Failed to fetch"}}` | Error Toast + Retry |
| RLS policy blocks | `{data: null, error: {message: "new row violates row-level security"}}` | Error Toast |
| Foreign key violation | `{data: null, error: {message: "insert or update on table violates foreign key constraint"}}` | Error Toast |
| Unique constraint | `{data: null, error: {message: "duplicate key value violates unique constraint"}}` | Error Toast |
| Invalid UUID format | `{data: null, error: {message: "invalid input syntax for type uuid"}}` | Input validation |
| Auth required | `{data: null, error: {message: "JWT token is required"}}` | Redirect to login |

---

## 4. Edge Functions Testing

### 4.1 approve-application

| Aspect | Details |
|--------|---------|
| Invoke | `supabase.functions.invoke('approve-application', {body: {applicationId}})` |
| Auth | Requires Bearer JWT (mentor role) |
| Success | `{success: true, studentId, email}` |
| Idempotent | `{success: true, code: 'ALREADY_PROCESSED', studentId, email}` |
| Errors | MISSING_FIELD (400), FORBIDDEN (403), NOT_FOUND (404), AUTH_CREATE_FAILED (500) |

### 4.2 gemini (AI)

| Aspect | Details |
|--------|---------|
| Invoke | `supabase.functions.invoke('gemini', {body: {prompt, context}})` |
| Auth | Requires Bearer JWT |
| Response | AI-generated text content |
| Errors | Invalid prompt, context too large, rate limit |

### 4.3 resend (Email)

| Aspect | Details |
|--------|---------|
| Invoke | `supabase.functions.invoke('resend', {body: {to, subject, html, templateKey, variables}})` |
| Auth | Requires Bearer JWT (service role or user) |
| Template | Uses `emailTemplateService.render()` before sending |
| Errors | Invalid email, template not found, Resend API error |

---

## 5. Test Cases

### Module 5.1: PostgREST — Goals

#### API-TC-001: Select Goals by Student ID

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-001 |
| **Module** | Goals Data Layer |
| **Feature** | Select Goals |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Integration |
| **Test Data** | Student1 UUID |
| **Preconditions** | Student1 authenticated, goals exist |

**Objective**: Verify `supabase.from('goals').select('*').eq('student_id', userId)` returns correct data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `supabase.from('goals').select('*', {count: 'exact'}).eq('student_id', student1Id)` | `{data: Goal[], count: 3, error: null}` |
| 2 | Verify data shape | Each goal has: id, student_id, title, description, progress_percentage, status, created_at, updated_at |
| 3 | Verify count matches seeded data | Count is 3 (matching Student1's seeded goals) |

---

#### API-TC-002: Insert Goal

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-002 |
| **Module** | Goals Data Layer |
| **Feature** | Insert Goal |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | `{student_id: student1Id, title: "Test Goal", description: "Testing", status: "not_started"}` |
| **Preconditions** | Student1 authenticated |

**Objective**: Verify goal insertion creates correct row.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `supabase.from('goals').insert({...}).select().single()` | `{data: Goal, error: null}` |
| 2 | Verify returned data | Row has auto-generated id, correct student_id, title, status = "not_started" |
| 3 | Verify DB state | Goal exists in table with correct values |

**Negative**: Insert with missing required field (student_id) → error.

---

#### API-TC-003: Update Goal

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-003 |
| **Module** | Goals Data Layer |
| **Feature** | Update Goal |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Update title and progress_percentage to 50 |
| **Preconditions** | Existing goal ID |

**Objective**: Verify goal update modifies row correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `supabase.from('goals').update({title: "Updated", progress_percentage: 50}).eq('id', goalId).select().single()` | `{data: Goal, error: null}` |
| 2 | Verify updated fields | title = "Updated", progress_percentage = 50 |
| 3 | Verify unchanged fields | student_id, created_at unchanged, updated_at updated by trigger |

---

#### API-TC-004: Delete Goal

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-004 |
| **Module** | Goals Data Layer |
| **Feature** | Delete Goal |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Existing goal ID |
| **Preconditions** | Goal exists |

**Objective**: Verify goal deletion removes row.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `supabase.from('goals').delete().eq('id', goalId)` | `{data: [], error: null}` |
| 2 | Verify goal no longer exists | Select by ID returns `{data: null, error: null}` |

**Edge case**: Delete non-existent ID → `{data: null, error: null}` (idempotent)

---

### Module 5.2: PostgREST — Messages

#### API-TC-005: Select Messages by Conversation

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-005 |
| **Module** | Messages Data Layer |
| **Feature** | Select Messages |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Integration |
| **Test Data** | Conversation ID for mentor + Student1 conversation |
| **Preconditions** | Student1 or mentor authenticated |

**Objective**: Verify messages are returned for a conversation.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', {ascending: true})` | `{data: Message[], error: null}` |
| 2 | Verify ordering | Messages sorted chronologically |
| 3 | Verify participant filter | Only messages for this conversation returned |

---

### Module 5.3: Pagination

#### API-TC-006: Paginated Query with Range

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-006 |
| **Module** | Pagination |
| **Feature** | Range-based Pagination |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Messages with many entries |
| **Preconditions** | Authenticated, conversation has 10+ messages |

**Objective**: Verify `.range()` pagination works.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `.range(0, 4)` — first page | 5 messages returned |
| 2 | Execute `.range(5, 9)` — second page | Next 5 messages returned |
| 3 | Verify no overlap | Pages contain distinct messages |
| 4 | Execute `.range(100, 109)` — beyond data | `{data: [], error: null}` |

---

### Module 5.4: Edge Functions

#### API-TC-007: Approve Application Edge Function

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-007 |
| **Module** | Edge Functions |
| **Feature** | approve-application |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Integration |
| **Test Data** | Valid application ID |
| **Preconditions** | Mentor authenticated, pending application exists |

**Objective**: Verify approve-application edge function creates student account.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.functions.invoke('approve-application', {body: {applicationId}})` | `{data: {success: true, studentId, email}, error: null}` |
| 2 | Verify new student profile | `profiles` table has new row with studentId |
| 3 | Verify application status | Application status updated to "approved" or "invited" |
| 4 | Verify idempotent | Calling again returns `{success: true, code: 'ALREADY_PROCESSED'}` |

**Validation**: `src/__tests__/approveApplicationViaEdge.test.ts`

---

#### API-TC-008: Gemini AI Edge Function

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-008 |
| **Module** | Edge Functions |
| **Feature** | gemini |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Prompt: "Summarize student progress" with context |
| **Preconditions** | Mentor authenticated |

**Objective**: Verify Gemini edge function returns AI response.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.functions.invoke('gemini', {body: {prompt, context}})` | `{data: {response: string}, error: null}` |
| 2 | Verify response contains text | Non-empty, relevant to prompt |

**Negative**: Empty prompt → error response.

---

#### API-TC-009: Resend Email Edge Function

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-009 |
| **Module** | Edge Functions |
| **Feature** | resend (email) |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Valid email, template key, variables |
| **Preconditions** | Authenticated user |

**Objective**: Verify Resend edge function sends email.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.functions.invoke('resend', {body: {to, subject, templateKey, variables}})` | `{data: {success: true, id: emailId}, error: null}` |
| 2 | Verify email sent | Email received at target address |
| 3 | Test invalid email | Error returned |

---

### Module 5.5: Supabase Auth

#### API-TC-010: Sign In with Password

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-010 |
| **Module** | Authentication |
| **Feature** | signInWithPassword |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Integration |
| **Test Data** | Valid mentor credentials |
| **Preconditions** | None |

**Objective**: Verify Supabase auth login works.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.auth.signInWithPassword({email: mentorEmail, password})` | `{data: {user, session}, error: null}` |
| 2 | Verify session | Session has access_token, refresh_token, expires_at |
| 3 | Verify user | User object has id, email, user_metadata with role |

**Negative**: Wrong password → `{data: {user: null, session: null}, error: AuthApiError}`

---

#### API-TC-011: Get Current Session

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-011 |
| **Module** | Authentication |
| **Feature** | getSession |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Integration |
| **Test Data** | Authenticated session |
| **Preconditions** | User logged in |

**Objective**: Verify session retrieval works.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.auth.getSession()` | `{data: {session}, error: null}` |
| 2 | Verify valid session | Session not null, user matches authenticated user |
| 3 | Logout, then call `getSession()` | `{data: {session: null}, error: null}` |

---

### Module 5.6: Supabase Storage

#### API-TC-012: Storage File Upload

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-012 |
| **Module** | Storage |
| **Feature** | File Upload |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Test image file |
| **Preconditions** | Authenticated user |

**Objective**: Verify file upload to storage bucket.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.storage.from('profile-avatars').upload('test/avatar.jpg', file, {upsert: true})` | `{data: {path: 'test/avatar.jpg'}, error: null}` |
| 2 | Verify file exists | `supabase.storage.from('profile-avatars').list('test')` returns file |
| 3 | Get public URL | `supabase.storage.from('profile-avatars').getPublicUrl('test/avatar.jpg')` returns URL |
| 4 | Clean up | Delete file after test |

---

### Module 5.7: Supabase Realtime

#### API-TC-013: Realtime Channel Subscription

| Field | Value |
|-------|-------|
| **Test ID** | API-TC-013 |
| **Module** | Realtime |
| **Feature** | Channel Subscription |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Channel on `messages` table |
| **Preconditions** | Authenticated user |

**Objective**: Verify Realtime subscription receives events.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Subscribe to `supabase.channel('test').on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'messages'}, callback)` | Subscription confirmed |
| 2 | Insert a message row | Callback fires with new row payload |
| 3 | Verify payload | Payload contains new message data |

---

## 6. Automation Mapping

| Test Cases | Tool | Existing Test | Status |
|-----------|------|---------------|--------|
| API-TC-001 to API-TC-004 | Vitest | `src/__tests__/taskService.test.ts` (similar pattern) | ❌ Missing for goals |
| API-TC-005 | Vitest | Not existing | ❌ Missing |
| API-TC-006 | Vitest | Not existing | ❌ Missing |
| API-TC-007 | Vitest | `approveApplicationViaEdge.test.ts` | ✅ Existing |
| API-TC-008 | Vitest | Not existing | ❌ Missing |
| API-TC-009 | Vitest | Not existing | ❌ Missing |
| API-TC-010, API-TC-011 | Playwright | `e2e/authentication/auth.spec.ts` | ✅ Existing |
| API-TC-012 | Playwright | Partial (in student/mentor flows) | Partial |
| API-TC-013 | Playwright | `e2e/realtime.spec.ts` (skipped) | ⚠️ Skipped |
