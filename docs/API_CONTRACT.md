# API Contract — approve-application Edge Function

**Endpoint:** `POST /functions/v1/approve-application`
**Runtime:** Deno (Supabase Edge Functions)
**Auth:** Bearer JWT (mentor role)

---

## Request

### Headers
| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <supabase_jwt>` | Yes |
| `Content-Type` | `application/json` | Yes |

### Body
```json
{
  "applicationId": "string (uuid)"
}
```

### Example
```bash
curl -X POST https://<project>.supabase.co/functions/v1/approve-application \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "550e8400-e29b-41d4-a716-446655440000"}'
```

---

## Responses

### ✅ Success (201)
```json
{
  "success": true,
  "studentId": "550e8400-e29b-41d4-a716-446655440001",
  "email": "student@example.com"
}
```

### ✅ Idempotent Skip (200)
```json
{
  "success": true,
  "code": "ALREADY_PROCESSED",
  "message": "Application was already invited",
  "studentId": "550e8400-e29b-41d4-a716-446655440001",
  "email": "student@example.com"
}
```

### ❌ Validation Error (400)
```json
{
  "success": false,
  "code": "MISSING_FIELD",
  "message": "applicationId is required",
  "step": "validate_input"
}
```

### ❌ Auth Error (401)
```json
{ "error": "Invalid token" }
```

### ❌ Forbidden (403)
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "You are not authorized to approve this application",
  "step": "authorization"
}
```

### ❌ Not Found (404)
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Application not found",
  "step": "fetch_application"
}
```

### ❌ Server Error (500)
```json
{
  "success": false,
  "code": "AUTH_CREATE_FAILED",
  "message": "Failed to create user account",
  "step": "create_auth_user"
}
```

---

## Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_INPUT` | 400 | Body is not valid JSON |
| `MISSING_FIELD` | 400 | `applicationId` is missing or not a string |
| `NOT_FOUND` | 404 | No application with the given ID |
| `FORBIDDEN` | 403 | Mentor is not authorized for this application |
| `ALREADY_PROCESSED` | 200 | Application was already approved/invited (idempotent) |
| `AUTH_CREATE_FAILED` | 500 | Supabase Auth could not create the user |
| `PROFILE_CREATE_FAILED` | 500 | Failed to create/upsert the public profile |
| `APPLICATION_UPDATE_FAILED` | 500 | Failed to update application status |
| `CRM_INIT_FAILED` | 500 | CRM record creation failed |
| `CONFIG_ERROR` | 500 | Server environment not configured |
| `UNEXPECTED_ERROR` | 500 | Unhandled server error |

---

## TypeScript Types

```typescript
// Request
interface ApproveApplicationRequest {
  applicationId: string
}

// Response (success)
interface ApproveApplicationSuccess {
  success: true
  studentId: string
  email: string
  code?: 'ALREADY_PROCESSED'
  message?: string
}

// Response (error)
interface ApproveApplicationError {
  success: false
  code: string
  message: string
  step: string
}
```

---

## Client Integration

```typescript
import { supabase } from '../lib/supabase'

async function approveViaEdge(applicationId: string) {
  const { data, error } = await supabase.functions.invoke('approve-application', {
    body: { applicationId },
  })

  if (error) throw new Error(error.message)
  if (!data.success) throw new Error(data.message)
  return data
}
```

## Rate Limiting

- 10 requests per minute per user (mentor)
- 100 requests per minute per IP
- Rate limit headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## CORS

- Allowed origins: `*` (configurable per environment)
- Methods: `POST`, `OPTIONS`
- Headers: `Content-Type`, `Authorization`
