# Account Provisioning — Complete Guide

**Date:** 2026-07-06
**Security Level:** CONFIDENTIAL — contains architecture details for student account creation

---

## Provisioning Flow

### Legacy Path (feature flag DISABLED)

```
Browser (client-side)
  │
  ├── supabase.auth.signUp(email, password)
  │     └── Creates auth.users row via anon key
  │
  ├── supabase.from('profiles').upsert(...)
  │     └── Creates profile via anon key + RLS
  │
  ├── crmInitializationService.initializeStudentCrm(...)
  │     └── Creates all CRM records via anon key + RLS
  │
  └── edgeFunctionService.sendEmail(...)
        └── Calls resend Edge Function
```

**Risks:**
- Password generated in browser JavaScript
- `supabase.auth.signUp()` called from client (can be intercepted)
- CRM creation spreads across multiple client-side DB calls
- No atomicity — partial provisioning possible
- No audit trail of who approved
- Email template does not include password

### New Path (feature flag ENABLED)

```
Browser (mentor dashboard)
  │ POST /functions/v1/approve-application
  │ Authorization: Bearer <mentor_jwt>
  │ Body: { applicationId }
  │
  ▼
Supabase Edge Function (server-side, service_role)
  │
  ├── Verify mentor authorization
  ├── admin.createUser(email, password, email_confirm=true)
  │     └── Auth user created + auto-confirmed
  ├── Profile upsert (service role bypasses RLS)
  ├── Application status → 'invited'
  ├── All CRM records created atomically
  ├── Welcome email sent with credentials
  └── Audit log written
```

**Security improvements:**
- Password generated server-side in Deno
- `admin.createUser` uses service_role key (never exposed)
- All operations in a single authenticated context
- Atomic with rollback on failure
- Full audit trail
- Welcome email includes temp password

---

## Rollback Logic (New Path)

```
Step fails at          → Action
─────────────────────────────────────────────────
create_auth_user       → Return error (nothing created)
create_profile         → Delete auth user
update_application     → Delete auth user + profile
initialize_crm         → Delete ALL created records + auth user
send_email             → Log failure, DO NOT rollback
```

Email failure is explicitly excluded from rollback because:
1. The student account already exists
2. The student can use "Forgot Password" to set their own password
3. The mentor can manually provide credentials

---

## Idempotency

The Edge Function checks `app.status` before processing:
- If `status === 'invited'` or `status === 'approved'` → skip, return `ALREADY_PROCESSED`
- This prevents duplicate account creation if the mentor clicks twice
- Also prevents re-provisioning after a partial failure

---

## Password Policy

- Generated using `crypto.randomUUID() + '!Aa1'`
- Meets common password complexity requirements:
  - Minimum 8 characters (UUID v4 = 36 chars + 4 = 40 chars)
  - Uppercase letter (UUID hex includes A-F)
  - Lowercase letter (UUID hex includes a-f)
  - Number (UUID hex includes 0-9)
  - Special character (`!`)
- Sent in welcome email
- Student should change on first login (no current enforcement)

---

## Email Template

The welcome email now includes the temporary password:
```
Subject: Welcome to Mentorino — Your Account Details

Welcome, [Name]!

Here are your account details:
Email: [email]
Temporary Password: [password]

Please sign in and change your password after your first login.
```

This fixes the pre-existing bug where the welcome email did not include credentials.
