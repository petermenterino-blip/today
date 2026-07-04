

# RC2 Implementation Plan — Fix All Blockers

## Sprint Structure

| Sprint | Focus | Issues | Est. Time | Outcome |
|--------|-------|--------|-----------|---------|
| **RC2-F1** | Security — Edge Functions | C1, C2 | 2h | Staging-safe |
| **RC2-F2** | Security — RLS & Storage | H2, H3, H4 | 3h | Security-complete |
| **RC2-F3** | Security — Invitation & Auth | H1, H5 | 1h | Zero high-severity |
| **RC2-F4** | Quality — Critical Bugs | QA-1–11 | 2h | Feature-correct |
| **RC2-F5** | Performance — Low Effort | P1 | 2h | Measurable improvement |
| **RC2-F6** | Performance — Medium Effort | P0 | 5h | Rendering efficiency |


## RC2-F1 — Security: Edge Functions

### Task F1.1 — Secure `scheduled/index.ts` (1h)

**Problem**: Service role key accessible by any JWT holder. Full DB access, mass email, destructive ops.

**Solution**: Replace `Authorization` header check with a `CRON_SECRET` env var. The Supabase cron scheduler sends this as a custom header. The function validates against it.

```typescript
// Before (line 15-18):
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS })
}

// After:
const cronSecret = req.headers.get('x-cron-secret')
const expectedSecret = Deno.env.get('CRON_SECRET')
if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS })
}
```

**Files**: `edge-functions/scheduled/index.ts`
**New env var**: `CRON_SECRET` (set via `supabase secrets set CRON_SECRET=<random>`)

### Task F1.2 — Secure `resend/index.ts` (1h)

**Problem**: Open email relay. Any authenticated user can send emails as `notifications@mentorino.com`.

**Solution**: Create a Supabase client inside the function using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, call `supabase.auth.getUser()` using the Authorization header's JWT, verify the caller has `mentor` role, and restrict the `to` address.

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inside serve handler, after auth header check:
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl!, supabaseKey!)
const { data: { user }, error: authError } = await supabase.auth.getUser(
  authHeader.replace('Bearer ', '')
)
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: CORS_HEADERS })
}
// Check caller is mentor
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()
if (profile?.role !== 'mentor') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS_HEADERS })
}
```

**Files**: `edge-functions/resend/index.ts`
**New env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or reuse from scheduled)


## RC2-F2 — Security: RLS & Storage

### Task F2.1 — Fix Storage Policy (30min)

**Problem**: `student-documents` bucket policy `docs_mentor_read_assigned` references `profiles.mentor_id` — column does not exist.

**Solution**: Replace the policy with a join through `program_enrollments` → `programs`:

```sql
-- File: supabase/migrations/014_storage.sql (lines 22-30)

drop policy if exists "docs_mentor_read_assigned" on storage.objects;

create policy "docs_mentor_read_assigned"
  on storage.objects for select
  using (
    bucket_id = 'student-documents' and
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'mentor'
    ) and
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pr.mentor_id = auth.uid()
      and pe.student_id::text = (storage.foldername(name))[1]
    )
  );
```

**Files**: `supabase/migrations/014_storage.sql`

### Task F2.2 — Add RLS for Event Child Tables (1.5h)

**Problem**: 4 event child tables (`event_attendees`, `event_files`, `event_feedbacks`, `event_recordings`) have RLS enabled but zero policies.

**Solution**: Add policies to `999_rls.sql`:

```sql
-- Event attendees
create policy "Users can read event attendees"
  on public.event_attendees for select
  using (auth.role() = 'authenticated');

create policy "Users can register for events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

create policy "Event creators can manage attendees"
  on public.event_attendees for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );
create policy "Event creators can delete attendees"
  on public.event_attendees for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- Event files
create policy "Authenticated users can read event files"
  on public.event_files for select
  using (auth.role() = 'authenticated');

create policy "Event creators can manage files"
  on public.event_files for insert
  with check (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );
-- (same for update/delete)

-- Event feedbacks
create policy "Authenticated users can read feedbacks"
  on public.event_feedbacks for select
  using (auth.role() = 'authenticated');

create policy "Attendees can submit feedback"
  on public.event_feedbacks for insert
  with check (
    exists (select 1 from public.event_attendees where event_id = event_feedbacks.event_id and user_id = auth.uid())
  );

-- Event recordings
create policy "Authenticated users can read recordings"
  on public.event_recordings for select
  using (auth.role() = 'authenticated');

create policy "Event creators can manage recordings"
  on public.event_recordings for insert
  with check (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );
-- (same for update/delete)
```

**Files**: `supabase/migrations/999_rls.sql`

### Task F2.3 — Add RLS for Remaining Zero-Policy Tables (1h)

**Problem**: 10 more functional tables with zero policies: `application_notes`, `application_info_requests`, `student_tags`, `student_timeline_events`, `custom_forms`, `form_templates`, `mentor_availability`, `products`, `transactions`, `announcements`.

**Solution**: Add basic authenticated-read, owner-write policies for each. These tables have frontend use (applications, store, etc.):

```sql
-- application_notes
create policy "Users can read own notes"
  on public.application_notes for select
  using (user_id = auth.uid());
create policy "Users can create notes"
  on public.application_notes for insert
  with check (user_id = auth.uid());

-- products (store)
create policy "Anyone can read products"
  on public.products for select
  using (true);
create policy "Mentors can manage products"
  on public.products for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'mentor'));

-- transactions
create policy "Users can read own transactions"
  on public.transactions for select
  using (user_id = auth.uid());
create policy "Users can create transactions"
  on public.transactions for insert
  with check (user_id = auth.uid());

-- announcements
create policy "Authenticated users can read announcements"
  on public.announcements for select
  using (auth.role() = 'authenticated');
create policy "Mentors can create announcements"
  on public.announcements for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'mentor'));

-- mentor_availability
create policy "Mentors can read own availability"
  on public.mentor_availability for select
  using (mentor_id = auth.uid());
create policy "Mentors can manage own availability"
  on public.mentor_availability for insert
  with check (mentor_id = auth.uid());
create policy "Mentors can update own availability"
  on public.mentor_availability for update
  using (mentor_id = auth.uid());

-- student_tags (junction table for profile tags)
create policy "Users can read student tags"
  on public.student_tags for select
  using (auth.role() = 'authenticated');
create policy "Mentors can manage student tags"
  on public.student_tags for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'mentor'));

-- student_timeline_events
create policy "Users can read own timeline"
  on public.student_timeline_events for select
  using (student_id = auth.uid());
create policy "Mentors can manage timeline"
  on public.student_timeline_events for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'mentor')
  );
```

**Files**: `supabase/migrations/999_rls.sql`


## RC2-F3 — Security: Invitation & Auth

### Task F3.1 — Remove Password from API Response (15min)

**Problem**: `approveApplication` returns `password: tempPassword` to the frontend.

**Solution**:

```typescript
// File: src/services/applicationService.ts, line ~319

// Before:
return { data: { id, email, name, password: tempPassword } }

// After:
return { data: { id, email, name } }
```

**Files**: `src/services/applicationService.ts`

### Task F3.2 — Fix authService Default Role Fallback (15min)

**Problem**: Missing profile role defaults to 'student' — can cause privilege misclassification.

**Solution**:

```typescript
// File: src/services/authService.ts

// Line 51: signIn method
role: profile?.role // remove '|| 'student''

// Line 111: getCurrentUser method  
role: profile?.role // remove '|| 'student''
```

Then update all callers to handle `role: undefined`:

```typescript
// AuthContext.tsx, line ~31-32
if (profileRes.data && profileRes.data.role) {
  setUser(profileRes.data);
  setRole(profileRes.data.role);
} else {
  setUser(null);
  setRole('visitor');
}
```

**Files**: `src/services/authService.ts`, `src/context/AuthContext.tsx`

### Task F3.3 — Fix Mentor Application Scope (30min)

**Problem**: Mentor SELECT on `applications` (999_rls.sql:331-334) allows ALL mentors to read ALL applications.

**Solution**: Scope to mentor's own program applications:

```sql
create policy "Mentors can read applications for their programs"
  on public.applications for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = applications.program_id and programs.mentor_id = auth.uid()
    )
  );
```

**Files**: `supabase/migrations/999_rls.sql`


## RC2-F4 — Quality: Critical Bugs

### Task F4.1 — Fix Hardcoded Messaging IDs (30min)

**Problem**: `WhatsAppMessaging.tsx` hardcodes mentor ID `'mentor-1'` and student name `'Alex Student'`.

**Solution**: Use actual user data from `currentUser` and look up mentor/student information from profiles.

**Files**: `src/features/messaging/WhatsAppMessaging.tsx`

### Task F4.2 — Fix Journal Title & Mood (15min)

**Problem**: Journal title collected but not persisted. Mood values mismatch.

**Solution**: Add `title` to `JournalEntry` interface and ensure mood values match.

**Files**: `src/features/student/StudentJournal.tsx`, `src/interfaces/journal.interface.ts`

### Task F4.3 — Fix Journal Error Handling (15min)

**Problem**: `journalStorage.create()` throws on error — unhandled rejection in `StudentJournal.tsx`.

**Solution**: Wrap `addJournal` call in try/catch with `notifyError`.

**Files**: `src/features/student/StudentJournal.tsx`

### Task F4.4 — Fix ProtectedRoute application_status (15min)

**Problem**: `application_status` may be undefined in ProtectedRoute if authService doesn't populate the User object with it.

**Solution**: Ensure `authService.signIn` and `authService.getCurrentUser` populate `application_status` on the returned User object.

**Files**: `src/services/authService.ts`, `src/components/shared/ProtectedRoute.tsx`

### Task F4.5 — Fix StudentEvent Toast (15min)

**Problem**: `notifySuccess` called without proper toast configuration — toast doesn't display.

**Solution**: Use `notifySuccess` with correct arguments.

**Files**: `src/features/student/StudentEvents.tsx`

### Task F4.6 — Fix Booking Error Handling (15min)

**Problem**: Booking insert is fire-and-forget with no error handling.

**Solution**: Add try/catch and error toast to the `onBook` callback.

**Files**: `src/app/App.tsx` (line 68), `src/pages/Booking.tsx`


## RC2-F5 — Performance: Low Effort

### Task F5.1 — Add loading="lazy" to Images (30min)

**Files to modify**: `src/pages/Landing.tsx`, `src/pages/Gallery.tsx`, `src/features/admin/GalleryManagement.tsx`, `src/features/settings/Settings.tsx`

**Pattern**: Add `loading="lazy"` to all `<img>` tags, especially below-the-fold images.

### Task F5.2 — Add Missing Alt Attributes (15min)

**Files**: Same as above. Add descriptive `alt` text to 5 images missing it.

### Task F5.3 — Fix useRealtime Stale Closure (30min)

**Problem**: Empty dependency array in `useRealtime` means subscriptions never refresh.

**Solution**: Use `useRef` for configs so the effect doesn't re-run when configs change:

```typescript
const configsRef = useRef(configs);
configsRef.current = configs;
// Use configsRef.current inside the effect
```

**Files**: `src/hooks/useRealtime.ts`

### Task F5.4 — Consolidate Duplicate Query Hooks (45min)

**Problem**: `useBookings` + `useBookingsQuery`, `useEvents` + `useEventsQuery` duplicate each other.

**Solution**: Remove one of each pair, update imports to use the surviving hook.

**Files**: `src/hooks/useBookings.ts`, `src/hooks/useBookingsQuery.ts`, `src/hooks/useEvents.ts`, `src/hooks/useEventsQuery.ts`


## RC2-F6 — Performance: Medium Effort

### Task F6.1 — Add React.memo to List Components (2h)

**Components to memoize**:
- `ConversationList.tsx`
- `MessageThread.tsx`
- `ComposeBar.tsx`
- `CalendarGrid.tsx`
- `ApplicationCard` (inside ApplicationsTab)

**Pattern**:
```typescript
export default React.memo(ConversationList);
```

### Task F6.2 — Add useMemo for Derived Data (1h)

**Hotspots**:
- `ConversationList.tsx`: `filteredConversations`
- `UserDashboard.tsx`: sorted/filtered task activities, sessions
- `MentorDashboard.tsx`: dashboard metrics

**Pattern**:
```typescript
const filteredConversations = useMemo(
  () => conversations.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())),
  [conversations, searchTerm]
);
```

### Task F6.3 — Reduce Parallel Dashboard Queries (2h)

**Problem**: 8-12 separate Supabase queries on dashboard mount.

**Solution A (quick)**: Set `staleTime` on all dashboard queries to avoid duplicate refetches:
```typescript
useQuery({
  queryKey: ['applications'],
  queryFn: () => applicationService.fetchAll(),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

**Solution B (better)**: Use Supabase joins or a single dashboard endpoint that batches data.

**Files**: All hooks in `src/hooks/`, `src/features/student/UserDashboard.tsx`, `src/features/mentor/hooks/useDashboard.ts`


## Execution Order

```mermaid
gantt
    title RC2 Fix Implementation
    dateFormat  D
    axisFormat  %d
    
    section F1 — Edge Function Security
    F1.1 scheduled/index.ts     :active, d1, 1d
    F1.2 resend/index.ts        :d2, 1d
    
    section F2 — RLS & Storage
    F2.1 Fix storage policy     :d3, 1d
    F2.2 Event table RLS        :d3, 1d
    F2.3 Remaining table RLS    :d4, 1d
    
    section F3 — Auth & Invitation
    F3.1 Remove password leak   :d5, 1d
    F3.2 Fix role fallback      :d5, 1d
    F3.3 Mentor scope           :d5, 1d
    
    section F4 — Quality Bugs
    F4.1-6 Critical bug fixes   :d6, 2d
    
    section F5 — Performance (quick)
    F5.1-4 Image + Realtime     :d7, 1d
    
    section F6 — Performance (deep)
    F6.1 React.memo             :d8, 2d
    F6.2 useMemo                :d9, 1d
    F6.3 Query consolidation    :d10, 2d
```

## Summary

| Sprint | Issues | Files | Est. Time |
|--------|--------|-------|-----------|
| F1 | 2 critical security | 2 edge functions | 2h |
| F2 | 1 high + 14 zero-policy tables | 2 migration files | 3h |
| F3 | 3 high | service.ts + rls.sql | 1h |
| F4 | 6 quality bugs | 6 component files | 2h |
| F5 | 4 performance (quick) | 5 files | 2h |
| F6 | 3 performance (deep) | 8+ files | 5h |

**Total**: ~15 hours across ~25 files.

After F1+F2+F3 → **READY FOR STAGING**
After F4 → **READY FOR INTERNAL ALPHA**
After F5+F6 → **READY FOR CLOSED PILOT**
