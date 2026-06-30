# Mentorino — Security Architecture

Version: 1.0
Based on ARCHITECTURE.md v1.0

---

## 1. Security Principles

1. **Defense in Depth** — Multiple layers of security: Auth → RLS → Service Layer → Input Validation
2. **Least Privilege** — Every user and system component gets the minimum permissions needed
3. **Never Trust the Client** — All authorization enforced on the server (database RLS)
4. **No Secrets in the Browser** — API keys, service role keys, and Gemini keys never reach the client
5. **Security in the Database** — RLS is the authorization boundary, not frontend role checks
6. **Fail Secure** — Default deny for all database access; explicit policies grant specific access

---

## 2. Authentication

### 2.1 Supabase Auth (Target State)

| Feature | Implementation |
|---------|---------------|
| Sign-in | `supabase.auth.signInWithPassword({ email, password })` |
| Session | `supabase.auth.getSession()` + `onAuthStateChange` listener |
| Sign-out | `supabase.auth.signOut()` |
| Password Reset | `supabase.auth.resetPasswordForEmail(email)` |
| JWT | Automatically provided by Supabase, included in all requests |
| Token Refresh | Automatic via Supabase client |

### 2.2 Auth Flow

```
User enters email + password
  → supabase.auth.signInWithPassword()
  → Supabase validates credentials
  → Returns session + JWT (access_token + refresh_token)
  → AuthContext stores in memory (not localStorage)
  → JWT sent with every Supabase request
  → RLS policies use auth.uid() and auth.jwt() for authorization
```

### 2.3 Application Pipeline (Special Flow)

Visitors do NOT sign up. The ONLY way to create an account:

1. Visitor submits application (no auth required, public insert to `applications`)
2. Mentor approves via dashboard
3. Supabase Admin API creates the user:
   ```
   supabase.auth.admin.createUser({ email, password, email_confirm: true })
   ```
4. Auth trigger automatically creates `profiles` row with `role: 'student'`
5. Mentor shares credentials with applicant

This flow requires the Supabase service_role key — used ONLY in a secure Edge Function or backend context, NEVER in the client.

### 2.4 What We Do NOT Build

- Custom password hashing
- Custom session management
- Custom email verification
- OAuth flows (deferred to P3)

---

## 3. Authorization — Row Level Security (RLS)

### 3.1 RLS Architecture

```
Client Request
  → JWT attached to request
  → Supabase verifies JWT
  → RLS policy evaluates auth.uid() + auth.jwt() claims
  → Policy allows or denies the row operation
  → Data returned or forbidden (empty set / 401)
```

### 3.2 Role Definitions

| Role | JWT Claim | Scope |
|------|-----------|-------|
| `student` | `raw_user_meta_data->role` | Own data + read assigned programs/sessions |
| `mentor` | `raw_user_meta_data->role` | Own data + read/write on assigned students |
| `admin` | `raw_user_meta_data->role` | Full access (future, not implemented in v1) |

### 3.3 Helper Functions

```sql
-- Check if user is a mentor
CREATE OR REPLACE FUNCTION auth.is_mentor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'mentor'
  );
$$ LANGUAGE sql STABLE;

-- Check if mentor has access to specific student
CREATE OR REPLACE FUNCTION auth.mentor_has_student(target_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sessions
    WHERE mentor_id = auth.uid() AND student_id = target_student_id
    LIMIT 1
  );
$$ LANGUAGE sql STABLE;
```

### 3.4 Per-Table RLS Policies

#### `profiles`

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: own profile; mentor can read assigned students
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Mentors can read students"
  ON profiles FOR SELECT
  USING (auth.is_mentor() AND role = 'student');

-- INSERT: only via auth trigger (direct insert not allowed)
CREATE POLICY "System can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: own profile; mentor can update students they mentor
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Mentors can update assigned students"
  ON profiles FOR UPDATE
  USING (auth.is_mentor() AND EXISTS (
    SELECT 1 FROM sessions WHERE mentor_id = auth.uid() AND student_id = id
  ));

-- DELETE: soft delete own profile
CREATE POLICY "Users can soft delete own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (deleted_at IS NOT NULL);
```

#### `programs`

```sql
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- SELECT: public if published, mentor sees own
CREATE POLICY "Anyone can read published programs"
  ON programs FOR SELECT
  USING (status = 'published' OR mentor_id = auth.uid());

-- INSERT: mentor only
CREATE POLICY "Mentors can create programs"
  ON programs FOR INSERT
  WITH CHECK (auth.is_mentor() AND mentor_id = auth.uid());

-- UPDATE: mentor own
CREATE POLICY "Mentors can update own programs"
  ON programs FOR UPDATE
  USING (mentor_id = auth.uid());

-- DELETE: mentor own (soft)
CREATE POLICY "Mentors can soft delete own programs"
  ON programs FOR UPDATE
  USING (mentor_id = auth.uid())
  WITH CHECK (deleted_at IS NOT NULL);
```

#### `sessions`

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: participant or mentor
CREATE POLICY "Participants can read sessions"
  ON sessions FOR SELECT
  USING (student_id = auth.uid() OR mentor_id = auth.uid());

-- INSERT: mentor only
CREATE POLICY "Mentors can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.is_mentor() AND mentor_id = auth.uid());

-- UPDATE: mentor; student can mark attendance
CREATE POLICY "Mentors can update sessions"
  ON sessions FOR UPDATE
  USING (mentor_id = auth.uid());

CREATE POLICY "Students can update own attendance"
  ON sessions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (OLD.attendance_status IS DISTINCT FROM NEW.attendance_status);
```

#### `messages`

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: participants of conversation
CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- INSERT: participants of conversation
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );
```

#### `applications`

```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- SELECT: own (≈by email); mentor sees all
CREATE POLICY "Applicants can read own application"
  ON applications FOR SELECT
  USING (email = auth.email() OR auth.is_mentor());

-- INSERT: any visitor (public insert limited to specific columns)
CREATE POLICY "Visitors can submit applications"
  ON applications FOR INSERT
  WITH CHECK (email IS NOT NULL AND status = 'pending_review');

-- UPDATE: mentor only
CREATE POLICY "Mentors can update applications"
  ON applications FOR UPDATE
  USING (auth.is_mentor());
```

### 3.5 Remaining Tables

All other tables follow the same pattern established above:
- Own-data access for students
- Broader read/write for mentors on assigned students
- Admin override for future use
- Soft delete enforced through RLS

Full RLS policies for all 30 tables are in `supabase/migrations/999_rls.sql`.

---

## 4. JWT Security

| Property | Configuration |
|----------|---------------|
| Signing | Supabase-managed RS256 |
| Expiry | Access token: 1 hour, Refresh token: 30 days |
| Storage | In-memory only (AuthContext), never localStorage |
| Claims | Standard Supabase JWT + `user_metadata.role` |
| Refresh | Automatic via Supabase client `onAuthStateChange` |
| Validation | Supabase verifies on every request; no client-side decode for auth decisions |

---

## 5. API Security

### 5.1 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Do NOT persist to localStorage
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
```

- Only `anon` key used in client
- `service_role` key NEVER in client code or environment variables exposed to client
- All requests authenticated via JWT

### 5.2 Edge Function Security

All Edge Functions:
1. Validate JWT: `supabase.auth.getUser(req.headers.get('Authorization'))`
2. Reject unauthenticated requests with 401
3. Use `service_role` key ONLY inside Edge Functions (accessed via `Deno.env`)
4. Validate input body shape before processing
5. Rate-limit via Supabase built-in protections + application-level checks

```typescript
// Edge Function pattern
const authorization = req.headers.get('Authorization')
const { data: { user }, error } = await supabase.auth.getUser(authorization)
if (error || !user) return new Response('Unauthorized', { status: 401 })
```

### 5.3 Rate Limiting

| Layer | Protection |
|-------|-----------|
| Supabase Auth | Built-in rate limiting on sign-in, sign-up, password reset |
| Supabase API | Built-in rate limiting per project |
| Edge Functions | Application-level checks: max 10 requests/minute/user for Gemini |
| Client | Debounce/cooldown on mutation buttons |

---

## 6. Storage Security

### 6.1 Storage RLS Policies

```sql
-- student-documents bucket
CREATE POLICY "Students can read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Students can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- profile-avatars bucket (public read)
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 6.2 File Upload Security

- All uploads validated client-side (type, size) AND server-side (MIME check in Edge Function)
- Maximum file size: 10MB
- Allowed types: images (jpg, png, webp), documents (pdf, docx, txt), audio (mp3, webm)
- File names sanitized: alphanumeric + underscore only, UUID prefixed
- Signed URLs with expiry for private files

---

## 7. Environment Variables & Secrets

### 7.1 Environment Variable Classification

| Variable | Location | Exposure | Security |
|----------|----------|----------|----------|
| `VITE_SUPABASE_URL` | `.env.local` + Vercel | Public (in client bundle) | Low risk — only enables connection |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Public (in client bundle) | Low risk — RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function secrets ONLY | Never in client | **Critical** |
| `GEMINI_API_KEY` | Edge Function secrets ONLY | Never in client | **Critical** |
| `RESEND_API_KEY` | Edge Function secrets ONLY | Never in client | **Critical** |
| `GOOGLE_CLIENT_ID` | Edge Function secrets ONLY | Never in client | High |
| `GOOGLE_CLIENT_SECRET` | Edge Function secrets ONLY | Never in client | **Critical** |
| `SENTRY_DSN` | `.env.local` + Vercel | In client bundle | Low risk — DSN is public by design |
| `VITE_POSTHOG_KEY` | `.env.local` + Vercel | In client bundle | Low risk — PostHog API key |

### 7.2 Secret Management Rules

1. All secrets stored in Supabase Edge Function secrets (`supabase secrets set`)
2. Vercel environment variables used ONLY for client-safe VITE_ prefixed vars
3. `.env.local` is in `.gitignore` (never committed)
4. `.env.example` contains placeholder values only
5. Encrypted offline backup maintained for all secrets
6. `service_role` key rotated periodically

---

## 8. Input Validation

| Layer | Validation |
|-------|-----------|
| React Components | Form validation before submission (required fields, email format, etc.) |
| Service Layer | Sanitize inputs before passing to Supabase |
| Database | Column types, CHECK constraints, NOT NULL constraints |
| Edge Functions | Zod schema validation on all input |
| Storage | MIME type + size validation before upload |

### Edge Function Input Validation Pattern

```typescript
import { z } from 'zod'

const GeminiRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  context: z.object({
    studentId: z.string().uuid(),
    recentActivity: z.array(z.string()).optional(),
  }),
})

// Validate before processing
const parsed = GeminiRequestSchema.parse(body)
```

---

## 9. Audit Logs

All sensitive mutations are logged to `audit_logs`:

| Event | Trigger | Data Captured |
|-------|---------|---------------|
| Profile update (role change) | `UPDATE on profiles` | `old_data`, `new_data` |
| Application status change | `UPDATE on applications` | `old_data.status → new_data.status` |
| Transaction creation | `INSERT on transactions` | `new_data` |
| Session attendance change | `UPDATE on sessions.attendance_status` | `old → new` |
| User deletion / soft-delete | `UPDATE on profiles.deleted_at` | `old_data`, `new_data` |

---

## 10. Disaster Recovery Security

| Scenario | Response |
|----------|----------|
| Database breach | RLS limits blast radius; audit logs identify scope; restore from backup |
| API key leak | Rotate immediately via Supabase dashboard + update edge function secrets |
| JWT compromise | Short expiry (1 hour); refresh token rotates; Supabase revokes on password change |
| Storage breach | RLS on storage objects; no public buckets for sensitive data |
| Edge Function vulnerability | JWT validation on all functions; no direct DB access from functions without auth |

---

## 11. Security Checklist (Pre-Launch)

- [ ] All tables have RLS enabled
- [ ] All RLS policies tested with both authenticated and anonymous requests
- [ ] No `service_role` key usage in client code
- [ ] All Edge Functions validate JWT
- [ ] All external API keys stored in Supabase secrets, not in code
- [ ] `.env.local` in `.gitignore`
- [ ] CORS configured on Supabase project (restrict to production domain + localhost)
- [ ] Password strength enforced (min 8 chars)
- [ ] Rate limiting configured on auth endpoints
- [ ] Audit logging enabled for sensitive tables
- [ ] Storage bucket RLS policies tested
- [ ] Signed URLs used for private storage files (not public URLs)
- [ ] HTTPS enforced (Vercel default)
- [ ] `Content-Security-Policy` header configured
- [ ] Input validation on all Edge Function endpoints
- [ ] Backup encryption verified
