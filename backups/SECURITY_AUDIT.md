# Security Audit

## Authentication Security

| Aspect | Status | Details |
|--------|--------|---------|
| Password hashing | ✅ Supabase managed | bcrypt via Supabase Auth |
| JWT expiry | ✅ Default | 1 hour tokens, auto-refreshed |
| Session persistence | ✅ localStorage | With auto-refresh |
| Rate limiting | ✅ Supabase managed | Built-in rate limiting on auth endpoints |
| Email confirmation | ✅ Enabled | Users must confirm email |
| Password reset | ✅ Secure | Time-limited reset token via email |
| CORS | ✅ Configurable | Vite dev server allows all hosts |
| XSS protection | ✅ React JSX | React auto-escapes output |
| CSRF | ✅ Supabase managed | Built-in CSRF protection |
| SQL injection | ✅ Parameterized | Supabase client uses parameterized queries |

## Row Level Security (RLS)

RLS is enabled on all 40+ public tables. Key patterns:

### Profiles RLS
| Policy | Operation | Rule |
|--------|-----------|------|
| Users can read own profile | SELECT | auth.uid() = id |
| Mentors can read assigned students | SELECT | JWT claim role = 'mentor' |
| Users can update own profile | UPDATE | auth.uid() = id |
| Mentors can update students they mentor | UPDATE | Via program_enrollments join |
| Users can insert own profile | INSERT | auth.uid() = id |
| Admins full access to profiles | ALL | JWT claim role = 'admin' |

### Sessions RLS
| Policy | Operation | Rule |
|--------|-----------|------|
| Participants can read sessions | SELECT | student_id OR mentor_id = auth.uid() |
| Mentors can insert sessions | INSERT | mentor_id = auth.uid() |
| Mentors can update sessions | UPDATE | mentor_id = auth.uid() |
| Students can update attendance | UPDATE | student_id = auth.uid() |
| Admins full access | ALL | is_admin() |

### Messaging RLS
- Participants can only see messages in conversations they belong to
- Mentors can create conversations and add participants
- Users can update their own messages only
- Mark-as-read allowed for all participants

### Events RLS
- Public events visible to anyone
- Mentors can create events
- Event creators manage their events (update, attendees, files, recordings)

### Applications RLS
- Users can only see their own applications
- Mentors can read all applications
- Anyone can submit applications (including anonymous)

### Storage RLS
- Public buckets (profile-avatars, gallery-images, public-website) readable by everyone
- Private buckets require authentication + ownership/mentor access
- Message attachments accessible only by conversation participants
- Anonymous uploads allowed only under `applications/` prefix

## JWT-Based Security (Migrations 031-032)

The most critical security fix eliminates RLS recursion:
- `is_mentor()` reads from JWT claims, never queries profiles table
- `is_admin()` reads from JWT claims, never queries profiles table
- `sync_profile_role_to_auth()` trigger keeps JWT role metadata in sync
- All mentor policies rewritten to use JWT-claim pattern
- All admin policies rewritten to use JWT-claim pattern

## Edge Function Security

| Function | Auth | Access |
|----------|------|--------|
| gemini | JWT + requireRole(student/mentor/admin) | Authenticated users |
| resend | JWT + requireRole(mentor/admin) | Mentors and admins |
| scheduled | x-cron-secret header | Cron jobs only |

## Environment Variables Security

| Variable | Exposed to client? | Risk |
|----------|-------------------|------|
| VITE_SUPABASE_URL | ✅ Yes (public) | Low - just the project URL |
| VITE_SUPABASE_ANON_KEY | ✅ Yes (public) | Low - anon key is safe for client |
| VITE_SENTRY_DSN | ✅ Yes (public) | Low - DSN is safe for client |
| SUPABASE_SERVICE_ROLE_KEY | ❌ No (server only) | 🔴 Critical - never expose |
| GEMINI_API_KEY | ❌ No (edge function) | 🔴 Critical - server-side only |
| RESEND_API_KEY | ❌ No (edge function) | 🔴 Critical - server-side only |
| CRON_SECRET | ❌ No (edge function) | 🔴 Critical - server-side only |

## Data Isolation

- Students can only access their own data (goals, journals, sessions, tasks, etc.)
- Mentors can access data of students in their programs
- Admins have full access across all tables
- Data isolation is enforced at DB level via RLS, not just UI
- No cross-tenant data leakage possible

## Known Security Considerations

1. `.env.local` contains the anon key and should never be committed (already in .gitignore)
2. Service role key should only be used in local scripts/edge functions
3. Storage buckets with public read access (profile-avatars, gallery-images, public-website) serve content to unauthenticated users
4. Anonymous uploads are restricted to `applications/` prefix only
5. No OAuth providers configured (email/password only)
