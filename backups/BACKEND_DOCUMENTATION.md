# Backend Documentation

## Overview

The backend is entirely powered by **Supabase** — no custom server infrastructure.

## Service Layer (`src/services/`)

All 30+ service files use the shared `supabase` client from `src/lib/supabase.ts`.

### Core Database Services

| Service | File | Purpose |
|---------|------|---------|
| authService | `authService.ts` | Login, signup, logout, password reset, session management, profile CRUD |
| applicationService | `applicationService.ts` | Mentorship applications CRUD + filters + stats |
| bookingService | `bookingService.ts` | Session bookings with conflict/capacity checks |
| sessionService | `sessionService.ts` | Mentoring sessions CRUD |
| programService | `programService.ts` | Program definitions CRUD |
| eventService | `eventService.ts` | Full event lifecycle: CRUD, registration, check-in, feedback, comments, speakers, files, waitlist, stats |
| eventRsvpService | `eventRsvpService.ts` | Simplified RSVP (register/unregister/get registrations) |
| messageService | `messageService.ts` | Conversations, messages, pin/archive, file upload, search, participants |
| reviewService | `reviewService.ts` | Reviews with status transitions, history tracking, stats |
| resourceService | `resourceService.ts` | Resource library: CRUD, comments, favorites, assignments, views/downloads, categories, versions |
| profileService | `profileService.ts` | Profile CRUD + avatar upload |
| studentService | `studentService.ts` | Student CRUD + timeline events + search |
| studentProgressService | `studentProgressService.ts` | Program progress tracking |
| visitorBookingService | `visitorBookingService.ts` | Visitor booking pipeline with notes/timeline |
| customFormService | `customFormService.ts` | Custom forms CRUD + assignments + submissions |
| surveyService | `surveyService.ts` | Surveys + responses |
| tagService | `tagService.ts` | Tags CRUD + student tagging |
| transactionService | `transactionService.ts` | Purchase transactions |
| socialLinksService | `socialLinksService.ts` | Social links CRUD |
| settingsService | `settingsService.ts` | Mentor settings + dashboard layouts |
| credentialService | `credentialService.ts` | Credential issuance |
| websiteSettingsService | `websiteSettingsService.ts` | Public website settings CRUD |
| timelineService | `timelineService.ts` | Student/mentor timeline events |
| galleryService | `galleryService.ts` | Gallery items CRUD + view count |
| curriculumService | `curriculumService.ts` | Mock program curriculum data |
| sharedFilesService | `sharedFilesService.ts` | Shared file uploads + bucket management |
| growthAuditService | `growthAuditService.ts` | Growth score calculation |
| crmInitializationService | `crmInitializationService.ts` | Auto-create welcome notifications + default goals |

### Local Fallback Storage Services

These use `safeQuery`/`safeMutate` pattern for resilience:

| Service | File | Purpose |
|---------|------|---------|
| taskStorage | `taskStorage.ts` | Tasks/ActionItems |
| goalStorage | `goalStorage.ts` | Goals with milestones CRUD |
| journalStorage | `journalStorage.ts` | Journal entries with mood/wins/challenges |
| notificationStorage | `notificationStorage.ts` | Notifications with unread tracking |

### Storage Service

`storageService.ts` — Centralized file operations:
- Image compression before upload
- Upload to any bucket
- Get public URL or signed URL
- Delete files
- List files in path
- Convenience methods: `uploadAvatar`, `uploadStudentDocument`, `uploadMentorResource`, `uploadGalleryImage`, `uploadMessageAttachment`

### AI/LLM Services

| Service | File | Purpose |
|---------|------|---------|
| aiAssistant | `aiAssistant.ts` | Orchestrates AI chat: chatWithContext, getStudentAnalysis, getProgramAnalysis, analyzeApplication, generateWeeklyReport, generateInsights |
| aiProvider | `aiProvider.ts` | Abstract AIProviderInterface + GeminiProvider (calls Supabase edge function) |
| geminiService | `geminiService.ts` | Thin wrapper for chatWithAssistant |
| contextEngine | `contextEngine.ts` | Fetches platform context (students, programs, sessions, applications, reviews, goals, tasks, resources, events, analytics, notifications) with caching |
| edgeFunctionService | `edgeFunctionService.ts` | Invokes Supabase edge functions: gemini(), sendEmail(), scheduleSessionReminder() |

## Supabase Client Configuration

```typescript
// src/lib/supabase.ts
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
  },
});
```

## Key Database Interactions

- **SELECT queries:** Used extensively across all services with filters, joins, ordering
- **INSERT/UPDATE/DELETE:** Standard CRUD operations
- **RPC calls:** `increment_resource_field`, `upsert_recently_viewed`, `increment_gallery_view_count`, `insert_notification`, `get_booking_stats`
- **Auth methods:** `signInWithPassword`, `signUp`, `signOut`, `getSession`, `getUser`, `onAuthStateChange`, `resetPasswordForEmail`, `updateUser`
- **Storage methods:** `upload`, `getPublicUrl`, `createSignedUrl`, `remove`, `list`
- **Realtime:** `channel()`, `on('postgres_changes')`, `subscribe()`, `removeChannel()`
- **Edge Functions:** `functions.invoke('gemini')`, `functions.invoke('resend')`, `functions.invoke('scheduled')`
