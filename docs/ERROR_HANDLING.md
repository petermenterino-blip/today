# Error Handling & Recovery — approve-application Edge Function

---

## Design Principle

**No partial users.** If the provisioning pipeline fails at any step before the
welcome email, ALL created resources are rolled back. The only acceptable partial
state is: user exists + profile exists + CRM exists BUT email failed (the user
can use Forgot Password).

---

## Error Recovery Matrix

| Step | Operation | On Failure |
|------|-----------|------------|
| 1 | Parse input | Return 400, no cleanup needed |
| 2 | Verify auth | Return 401/403, no cleanup needed |
| 3 | Fetch application | Return 404, no cleanup needed |
| 4 | Idempotency check | Return 200 (skip), no cleanup needed |
| 5 | Mentor authorization | Return 403, no cleanup needed |
| **6** | **Create auth user** | **Return 500, no cleanup needed (nothing created yet)** |
| **7** | **Create profile** | **Delete auth user → Return 500** |
| **8** | **Update application** | **Delete auth user + profile → Return 500** |
| **9** | **Init CRM** | **Delete ALL records + auth user → Return 500** |
| 10 | **Send email** | **Log failure, DO NOT rollback → Return 200** |

## Rollback Functions

### `rollbackAuthUser(admin, userId)`
Deletes the auth user via `admin.auth.admin.deleteUser(userId)`.
Called when profile creation fails.

### `rollbackAll(admin, userId, applicationId)`
Deletes ALL created resources:
1. `analytics_events` rows for user
2. `conversations` + `conversation_participants` for user
3. `goals` for user
4. `student_timeline_events` for user
5. `dashboard_layouts` for user
6. `student_progress` for user
7. `profiles` row for user
8. `applications` status reset to `pending_review`
9. Auth user deletion

Each step is `try/catch` with best-effort — if one cleanup fails, the next continues.

## Audit Logging

Every operation step logs to `analytics_events`:

```typescript
const log = (step: string, status: string, extra: Record<string, unknown> = {}) => {
  admin.from('analytics_events').insert({
    event_type: 'approval_audit',
    properties: {
      step, status,
      mentor_id: user.id,
      application_id: body.applicationId,
      timestamp: new Date().toISOString(),
      ...extra,
    },
  })
}
```

Audit log failures are caught silently — they must never block provisioning.

## Retry Safety

The Edge Function is idempotent — calling it multiple times with the same
`applicationId` is safe:
- First call: provisions the student
- Subsequent calls: return `ALREADY_PROCESSED` immediately
- This protects against:
  - Double-clicks by the mentor
  - Network retries by the client
  - Accidental re-submission

## Expected Error Types

### Input Validation
```json
{ "success": false, "code": "INVALID_INPUT", "message": "Invalid JSON body", "step": "parse_input" }
{ "success": false, "code": "MISSING_FIELD", "message": "applicationId is required", "step": "validate_input" }
```

### Authorization
```json
{ "success": false, "code": "NOT_FOUND", "message": "Application not found", "step": "fetch_application" }
{ "success": false, "code": "FORBIDDEN", "message": "You are not authorized to approve this application", "step": "authorization" }
```

### Provisioning
```json
{ "success": false, "code": "AUTH_CREATE_FAILED", "message": "Failed to create user account", "step": "create_auth_user" }
{ "success": false, "code": "PROFILE_CREATE_FAILED", "message": "Failed to create student profile", "step": "create_profile" }
{ "success": false, "code": "APPLICATION_UPDATE_FAILED", "message": "Failed to update application status", "step": "update_application" }
{ "success": false, "code": "CRM_INIT_FAILED", "message": "Details...", "step": "initialize_crm" }
{ "success": false, "code": "UNEXPECTED_ERROR", "message": "Details...", "step": "unknown" }
```

### Success with Warning
```json
{ "success": true, "studentId": "uuid", "email": "student@example.com" }
// If email fails, student is created but welcome email was not sent.
// The audit log will show step "send_email" with status "failed".
```
