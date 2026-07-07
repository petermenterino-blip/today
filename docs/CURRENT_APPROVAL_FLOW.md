# Current Approval Flow — Complete Audit

**Date:** 2026-07-06
**Auditor:** Phase 2 Agent (Senior Supabase Architect)
**Status:** Complete

---

## Flow Diagram (High-Level)

```
Mentor clicks "Approve" button
  │
  ▼
ApplicationsTab.tsx onApprove(app.id)
  │
  ▼
useApplicationReview.ts handleApplicationAction(id, 'approved')
  │
  ▼
applicationService.approveApplication(id)   ←── CORE PROVISIONING LOGIC
  │
  ├── 1. Fetch application row (SELECT * FROM applications WHERE id = ?)
  │
  ├── 2. Generate tempPassword (crypto.randomUUID + '!Aa1')
  │
  ├── 3. Create Auth user (supabase.auth.signUp) OR direct profile upsert
  │
  ├── 4. Upsert profile into public.profiles
  │
  ├── 5. Update application status → 'invited'
  │
  ├── 6. Initialize CRM (crmInitializationService)
  │     ├── student_progress
  │     ├── dashboard_layouts
  │     ├── analytics_events
  │     ├── student_timeline_events
  │     ├── default goals (2)
  │     └── conversation + participants
  │
  ├── 7. Send welcome email (via resend Edge Function)
  │
  └── 8. Dispatch window event
```

---

## Step-by-Step Breakdown

### Step 1: UI Entry Point

| Item | Value |
|------|-------|
| File | `src/features/mentor/components/ApplicationsTab.tsx` |
| Line | 96-102 |
| Component | `ApplicationCard` |
| Trigger | Click on green checkmark button |
| Callback | `onApprove(app.id)` |
| Passes through | `handleApplicationAction(id, 'approved')` in `useApplicationReview.ts` |

**UI code (ApplicationsTab.tsx:96-102):**
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onApprove(app.id); }}
  className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-all active:scale-95"
  title="Approve"
>
  <CheckCircle size={16} />
</button>
```

### Step 2: Hook (useApplicationReview.ts)

| Item | Value |
|------|-------|
| File | `src/features/mentor/hooks/useApplicationReview.ts` |
| Line | 92-115 |
| Method | `handleApplicationAction` |
| Status check | `if (status === 'approved')` |
| Service call | `applicationService.approveApplication(id)` |
| Error handling | `notifyError(err.message)` |
| Success | `notifySuccess(...)` + `refreshApps()` |

### Step 3: Core Provisioning (applicationService.ts)

| Item | Value |
|------|-------|
| File | `src/services/applicationService.ts` |
| Method | `approveApplication(id: string)` |
| Lines | 318-420 |

**Sub-operations in order:**

#### 3a. Fetch application (line 319-324)
```ts
const { data: app, error: fetchError } = await supabase
  .from('applications').select('*').eq('id', id).single()
```
- Reads: `first_name, last_name, email, program_id, mentor_id, focus_area, reason_for_applying, user_id`

#### 3b. Generate temp password (line 328)
```ts
const tempPassword = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 18)) + '!Aa1';
```

#### 3c. Auth user creation (line 332-377)

Two paths depending on `AUTH_SIGNUP_DISABLED`:

**Path A: Auth disabled (local/dev)**
```ts
userId = app.user_id || crypto.randomUUID();
await supabase.from('profiles').upsert({ id: userId, email, name, role: 'student', ... });
```

**Path B: Auth enabled (production)**
```ts
const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
  email, password: tempPassword,
  options: { data: { full_name: fullName, role: 'student' } },
});
if (signUpData?.user) {
  userId = signUpData.user.id;
  await supabase.from('profiles').upsert({ id: userId, email, name, role: 'student', ... });
}
```

**Security concern:** `supabase.auth.signUp()` is called from the browser with the anon key.
This means the request goes through the client, not through a privileged backend.

#### 3d. Update application status (line 379-383)
```ts
await supabase.from('applications').update({ status: 'invited' }).eq('id', id);
```

#### 3e. Initialize CRM (line 385-402)
Call: `crmInitializationService.initializeStudentCrm({ userId, email, name, applicationId, programId, focusArea })`

Sub-operations inside CRM initialization (`src/services/crmInitializationService.ts` lines 5-145):

| # | Table | Operation | Details |
|---|-------|-----------|---------|
| 1 | `profiles` | UPDATE | Set health_status, status, metrics, growth_score, mentor_id, specialization, program_id, application_status |
| 2 | `student_timeline_events` | INSERT | `autoLogApplicationApproved()` via timelineService |
| 3 | `student_progress` | INSERT if not exists | `{ user_id, program_id, started_at, lessons: {} }` |
| 4 | `dashboard_layouts` | INSERT if not exists | `{ user_id, layout: [] }` |
| 5 | `analytics_events` | INSERT | `{ event_type: 'student_approved', properties: {...} }` |
| 6 | `student_timeline_events` | INSERT | `application_approved` event |
| 7 | `goals` | INSERT if none exist | 2 default goals |
| 8 | `conversations` | INSERT if none exist | Create conversation + participants with mentor |

**Error handling:** `catch { // CRM initialization failure does not block the approval }`

#### 3f. Send welcome email (line 404-413)
```ts
await edgeFunctionService.sendEmail(email, 'welcome', { name: fullName, email, tempPassword });
```

**Bug:** The `welcome` email template in `resend/index.ts` only uses `data.name` and ignores `data.tempPassword`. The student never receives their password.

**Error handling:** `catch { // Email send failure does not block the invitation }`

#### 3g. Dispatch event (line 414)
```ts
window.dispatchEvent(new Event('user-profile-changed'));
```

### Step 4: Database Triggers

Multiple triggers fire automatically:

| Trigger | File | Timing | Action |
|---------|------|--------|--------|
| `on_auth_user_created` | `900_auth_triggers.sql` | After INSERT on `auth.users` | Creates `public.profiles` row |
| `on_student_crm_created` | `030_crm_auto_create.sql` | After INSERT on `profiles` | Creates `student_progress`, `dashboard_layouts`, timeline event |
| `trg_sync_profile_role_to_auth` | `031_fix_is_mentor_jwt.sql` | After INSERT/UPDATE on `profiles` | Syncs role to `auth.users.raw_user_meta_data` |
| `on_student_login_track` | `030_crm_auto_create.sql` | After UPDATE of `last_login` | Logs login timeline event |

---

## Services Used

| Service | File | Role |
|---------|------|------|
| `applicationService` | `src/services/applicationService.ts` | Orchestrates the entire flow |
| `crmInitializationService` | `src/services/crmInitializationService.ts` | Creates all CRM records |
| `timelineService` | `src/services/timelineService.ts` | Logs timeline events |
| `edgeFunctionService` | `src/services/edgeFunctionService.ts` | Invokes edge functions for email |

---

## Database Writes (per approval)

| Table | Write Type | Data |
|-------|-----------|------|
| `auth.users` | INSERT (via signUp) | email, password, user_metadata |
| `public.profiles` | UPSERT | id, email, name, role, mentor_id, etc. |
| `applications` | UPDATE | status → 'invited' |
| `student_progress` | INSERT (if not exists) | user_id, program_id |
| `dashboard_layouts` | INSERT (if not exists) | user_id, layout |
| `analytics_events` | INSERT | event_type, properties |
| `student_timeline_events` | INSERT (x2) | application_approved, CRM initialized |
| `goals` | INSERT (x2 if none exist) | 2 default goals |
| `conversations` | INSERT (if not exists) | mentor_id, student_id |
| `conversation_participants` | INSERT (x2) | mentor + student |

---

## Auth Calls

| Call | SDK Method | Line |
|------|-----------|------|
| Create user | `supabase.auth.signUp()` | applicationService.ts:350 |
| (None for profile — handled by trigger or upsert) | | |

---

## Security Issues Identified

| ID | Issue | Severity | Description |
|----|-------|----------|-------------|
| S-01 | Browser-side account creation | 🔴 CRITICAL | `supabase.auth.signUp()` called from client code with anon key |
| S-02 | Temp password generated in browser | 🔴 CRITICAL | Password is generated, stored in memory, and passed through client code |
| S-03 | No mentor authorization check | 🟠 HIGH | Any authenticated user can call `approveApplication()` — only RLS prevents unauthorized use |
| S-04 | Silent CRM failure | 🟡 MEDIUM | CRM failures are caught silently — student gets a profile but no CRM records |
| S-05 | Silent email failure | 🟡 MEDIUM | Email failures are caught silently — student gets no credentials |
| S-06 | Temp password not in welcome email | 🟡 MEDIUM | Welcome template ignores `tempPassword` — student cannot log in |
| S-07 | No idempotency check | 🟡 MEDIUM | No guard against double-approval of the same application |
| S-08 | No audit log | 🟢 LOW | No record of who approved what, when |

---

## Files Involved

| File | Purpose |
|------|---------|
| `src/features/mentor/components/ApplicationsTab.tsx` | Approve button UI |
| `src/features/mentor/hooks/useApplicationReview.ts` | Approval action handler |
| `src/services/applicationService.ts` | Core provisioning logic |
| `src/services/crmInitializationService.ts` | CRM record creation |
| `src/services/timelineService.ts` | Timeline event logging |
| `src/services/edgeFunctionService.ts` | Edge function invocation |
| `src/lib/supabase.ts` | Supabase client config |
| `supabase/functions/resend/index.ts` | Welcome email sending |
| `supabase/migrations/900_auth_triggers.sql` | Profile auto-creation trigger |
| `supabase/migrations/030_crm_auto_create.sql` | CRM auto-creation trigger |
