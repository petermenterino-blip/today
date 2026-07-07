# Mentor Feature Matrix

| Feature | Status | Evidence | Gap / recommended fix | Priority |
|---|---|---|---|---|
| Real login/dashboard/logout | PASS | Playwright mentor setup, overview, logout | — | Critical |
| Applications/list/details/approve/reject UI | PASS | Five browser tests passed | Approval Edge Function returned 503 to probe; validate authenticated mutation end-to-end | Critical |
| Students | PASS | Mentees list rendered with seeded users | Student detail CRUD not exhaustive | High |
| Messaging/realtime | PASS | Tab plus both live message directions | Attachment/duplicate/offline cases missing | Critical |
| Resources, sessions, analytics, settings | PASS | Pages rendered without console errors | CRUD/export/upload/settings persistence missing | High |
| Goals, tasks, notifications, calendar, reviews, reports | PARTIAL | Live tables/data exist | Full mentor UI CRUD and downstream sync not executed | Critical |
| AI features | PARTIAL | Gemini endpoint returned 503 to unauthenticated probe | Validate authorized success, quotas and failure UI | High |
| Website management/profile | PARTIAL | Not in executed suite | Add CRUD/persistence/permission tests | High |

Evidence: `playwright-report/index.html`; direct database counts in `DATABASE_VALIDATION.md`.
