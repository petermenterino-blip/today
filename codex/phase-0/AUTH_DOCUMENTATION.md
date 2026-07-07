# Authentication Documentation

**Auth Provider:** Supabase Auth (GoTrue v2.192.0)
**Frontend:** AuthContext + authService

---

## Authentication Flow

### Login Flow
```
User → /auth → email + password → supabase.auth.signInWithPassword()
  → JWT returned → getOrCreateProfileForUser()
  → AuthContext.setUser() + setRole()
  → Redirect to dashboard (student → /student, mentor → /mentor)
```

### Signup Flow
```
User → /auth → email + password + fullName → supabase.auth.signUp()
  → Auth user created with metadata { role: 'student' }
  → Trigger on_auth_user_created creates profile row
  → Return to auth page with confirmation
```

### Invitation Flow (Current — Browser-Side)
```
Mentor approves application → browser creates auth user
  → supabase.auth.signUp() with temp password
  → Profile upsert → CRM initialization → Email sent with credentials
  → Student accepts via email lookup + password
```

### Password Reset Flow
```
User → /reset-password → email → supabase.auth.resetPasswordForEmail()
  → Email with reset link → User clicks → /reset-password
  → supabase.auth.updateUser({ password })
```

## Session Management

| Feature | Implementation |
|---------|---------------|
| Token Refresh | `autoRefreshToken: true` in Supabase client |
| Session Persistence | `persistSession: true` (localStorage) |
| Session Detection | `detectSessionInUrl: false` (manual handling) |
| Init Timeout | 8 seconds — fallback to visitor |
| JWT Fallback | If profile fetch fails, read role from `user_metadata`/`app_metadata` |
| Idle Recovery | `idleRecovery.mount()` validates session on return from idle |

## Role System

| Role | Description | Access Level |
|------|-------------|--------------|
| `visitor` | Unauthenticated user | Public pages only |
| `student` | Enrolled mentorship student | Own data + assigned resources |
| `mentor` | Mentor/Admin | Own students + admin features |
| (admin via DB) | Full system access | Via `is_admin()` RLS function |

## Auth State Change Handling

```
supabase.auth.onAuthStateChange((event, session) → {
  SIGNED_IN / TOKEN_REFRESHED → callback(user from metadata)
    → Fire-and-forget profile enrichment
  SIGNED_OUT → callback(null)
})
```

## Edge Function Authentication

All edge functions use JWT verification via shared middleware:
1. Extract `Authorization: Bearer <token>` header
2. `supabase.auth.getUser(token)` to verify
3. Look up profile role from `profiles` table
4. Return user + role or 401/403 error

## Security Notes

| Aspect | Status |
|--------|--------|
| JWT Expiry | Managed by Supabase (default ~1 hour) |
| Refresh Token Rotation | Enabled by Supabase |
| Password Strength | Supabase default (min 6 chars) |
| Email Confirmation | Supabase configurable |
| Rate Limiting | Supabase managed |
| CORS | Edge functions allow all origins |
| Service Role Key | Used in scheduled function + middleware |
| Invitation Security | 🟡 Browser-side account creation (Phase 2 target) |
