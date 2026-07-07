# Edge Function Architecture — approve-application

**Date:** 2026-07-06
**Function:** `supabase/functions/approve-application/index.ts`

---

## Overview

The `approve-application` Edge Function handles ALL student account provisioning
in a secure, server-side environment. It replaces the browser-side
`applicationService.approveApplication()` when the `VITE_ENABLE_EDGE_APPROVAL=true`
feature flag is enabled.

## Architecture

```
Browser (mentor dashboard)
  │
  │ POST /functions/v1/approve-application
  │ Authorization: Bearer <mentor_jwt>
  │ Body: { applicationId: "uuid" }
  │
  ▼
Supabase Edge Function
  │
  ├── 1. Verify JWT → mentor role
  │
  ├── 2. Fetch application (service_role)
  │
  ├── 3. Check idempotency (skip if already processed)
  │
  ├── 4. Create auth user (admin.createUser)
  │       └── FAIL → stop, return error
  │
  ├── 5. Create student profile (upsert)
  │       └── FAIL → delete auth user, return error
  │
  ├── 6. Update application → 'invited'
  │       └── FAIL → rollback all, return error
  │
  ├── 7. Initialize CRM
  │       ├── student_progress
  │       ├── dashboard_layouts
  │       ├── timeline events
  │       ├── default goals (2)
  │       ├── conversation + participants
  │       └── analytics event
  │       └── FAIL → rollback all, return error
  │
  ├── 8. Send welcome email (via Resend API)
  │       └── FAIL → log, but DO NOT rollback
  │
  └── 9. Return success { studentId, email }
```

## Security Model

| Concern | Implementation |
|---------|---------------|
| Authorization | JWT verification via `verifyAuth()` + `requireRole(['mentor'])` |
| Database access | `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS for provisioning |
| Password generation | Server-side `crypto.randomUUID() + '!Aa1'` — never exposed to browser |
| Input validation | `applicationId` required, type-checked |
| Idempotency | Checks `app.status` before processing; skips if already `invited`/`approved` |
| Mentor scoping | If `app.mentor_id` is set, only that mentor can approve; otherwise any mentor can |
| Rollback | All failures before email send trigger full cleanup of created resources |
| Audit logging | Every step logs to `analytics_events` with type `approval_audit` |

## Request/Response Contract

### Request
```json
{
  "applicationId": "uuid"
}
```

### Success Response
```json
{
  "success": true,
  "studentId": "uuid",
  "email": "student@example.com"
}
```

### Error Response
```json
{
  "success": false,
  "code": "AUTH_CREATE_FAILED",
  "message": "Failed to create user account",
  "step": "create_auth_user"
}
```

### Idempotent (Already Processed)
```json
{
  "success": true,
  "code": "ALREADY_PROCESSED",
  "message": "Application was already invited",
  "studentId": "uuid",
  "email": "student@example.com"
}
```

## Error Codes

| Code | HTTP Status | Meaning | Rollback? |
|------|-------------|---------|-----------|
| `INVALID_INPUT` | 400 | Malformed JSON | N/A |
| `MISSING_FIELD` | 400 | `applicationId` missing | N/A |
| `NOT_FOUND` | 404 | Application not in database | N/A |
| `FORBIDDEN` | 403 | Mentor not authorized for this app | N/A |
| `ALREADY_PROCESSED` | 200 | Idempotent skip | N/A |
| `AUTH_CREATE_FAILED` | 500 | `admin.createUser` failed | No cleanup needed |
| `PROFILE_CREATE_FAILED` | 500 | Profile upsert failed | Delete auth user |
| `APPLICATION_UPDATE_FAILED` | 500 | Status update failed | Full rollback |
| `CRM_INIT_FAILED` | 500 | CRM records not created | Full rollback |
| `CONFIG_ERROR` | 500 | Missing env vars | N/A |
| `UNEXPECTED_ERROR` | 500 | Unhandled exception | Full rollback |

## Dependencies

- **Runtime:** Deno (Supabase Edge Functions)
- **SDK:** `@supabase/supabase-js@2` (service role client)
- **Auth:** `middleware/auth.ts` (JWT verification + role check)
- **Email:** Resend API (`api.resend.com`)
- **Environment variables:**
  - `SUPABASE_URL` — auto-injected by Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` — for admin DB operations
  - `RESEND_API_KEY` — for sending welcome emails

## Audit Logging

Every operation step logs an event to `analytics_events`:
```json
{
  "event_type": "approval_audit",
  "properties": {
    "step": "create_auth_user",
    "status": "completed",
    "mentor_id": "uuid",
    "application_id": "uuid",
    "timestamp": "ISO8601",
    "user_id": "uuid"  // on completion
  }
}
```
