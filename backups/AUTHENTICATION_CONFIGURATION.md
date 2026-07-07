# Authentication Configuration

## Auth Provider
**Supabase Auth** (built-in, no external provider)

## Login Method
- **Email + Password** only (no social/OAuth providers configured)
- Signups are open (anyone can register)

## Auth Flow

### Sign Up
1. User fills in email + password + name + role on `/auth` page
2. `authService.signUp()` calls `supabase.auth.signUp()`
3. Auth trigger `handle_new_user()` auto-creates profile row
4. `crmInitializationService` creates welcome notification + default goals
5. User redirected to `/pending-approval` if status is 'applied', else to `/dashboard`

### Sign In
1. User enters email + password on `/auth` page
2. `authService.signIn()` calls `supabase.auth.signInWithPassword()`
3. AuthContext updates with user session + profile
4. Role-based redirect (student → UserDashboard, mentor → MentorDashboard, admin → Admin)

### Password Reset
1. User requests reset on `/auth` page
2. `authService.resetPassword()` calls `supabase.auth.resetPasswordForEmail()`
3. User receives email with reset link
4. User redirected to `/reset-password` page
5. `authService.updatePassword()` calls `supabase.auth.updateUser()`

### Session Management
- **Auto-refresh:** Enabled (`autoRefreshToken: true`)
- **Persist session:** Enabled (localStorage)
- **Detect session in URL:** Disabled
- **Idle recovery:** `src/lib/idleRecovery.ts` refreshes session on user activity after idle period
- **Session check on load:** `supabase.auth.getSession()` with JWT fallback

## Auth Configuration (Supabase Dashboard)

| Setting | Value |
|---------|-------|
| Auth enabled | ✅ Yes |
| New users sign up | ✅ Enabled |
| Confirm email | Default (email confirmation enabled) |
| Allow/disallow new sign-ups | Allowed |
| Redirect URLs | Production URL + http://localhost:3000 |
| Site URL | Production URL |
| JWK verification | Enabled |
| JWT expiry | 3600 seconds (1 hour default) |
| Session duration | 7 days |

## JWT Claims Structure

The JWT tokens contain user metadata including role:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "user_metadata": {
    "role": "student"
  },
  "app_metadata": {
    "provider": "email"
  }
}
```

Role metadata is synced from `profiles.role` → `auth.users.raw_user_meta_data` via the `sync_profile_role_to_auth()` trigger (migration 031).

## Frontend Auth Components

### AuthContext (`src/context/AuthContext.tsx`)
Provides:
- `user` — Current user object with profile data
- `role` — User role (student/mentor/admin)
- `authLoading` — Loading state
- `authError` — Error state
- `login(email, password)` — Sign in
- `signup(email, password, name, role)` — Register
- `logout()` — Sign out
- `forgotPassword(email)` — Reset password email
- `resetPassword(password)` — Update password
- `clearError()` — Clear auth errors
- `refreshSession()` — Force refresh

### ProtectedRoute (`src/components/shared/ProtectedRoute.tsx`)
- Redirects to `/auth` if not authenticated
- Redirects to `/pending-approval` if user status is 'applied'
- Allows access if authenticated

### App.tsx Route Switching
- After auth loads, determines role and renders:
  - `role === 'student'` → `UserDashboard`
  - `role === 'mentor'` → `MentorDashboard`
  - `role === 'admin'` → Admin-specific views

## Auth Triggers

| Trigger Name | Event | Function | Purpose |
|-------------|-------|----------|---------|
| on_auth_user_created | auth.users INSERT | handle_new_user() | Auto-create profile on signup |
| trg_sync_profile_role_to_auth | profiles INSERT/UPDATE role | sync_profile_role_to_auth() | Sync role to JWT metadata |
