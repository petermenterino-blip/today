# Test Selector Guide

## Principles
All staging Playwright tests use **real DOM selectors** matching the actual application. No `data-testid` attributes are used (the app source doesn't have them). Tests prefer:
1. `getByRole()` — for navigation links, buttons, headings
2. `getByText()` — for content-based assertions
3. `getByPlaceholder()` — for form inputs
4. Robust CSS fallbacks only when above don't apply

## Route Structure

### Mentor (hash-based routing with query parameter tabs)

| Test Route | App Route | Tab Value |
|---|---|---|
| `/#/mentor` | `/#/mentor` | overview (default) |
| `/#/mentor?tab=applications` | `/#/mentor?tab=applications` | applications |
| `/#/mentor?tab=mentees` | `/#/mentor?tab=mentees` | mentees |
| `/#/mentor?tab=messaging` | `/#/mentor?tab=messaging` | messaging |
| `/#/mentor?tab=resources` | `/#/mentor?tab=resources` | resources |
| `/#/mentor?tab=sessions` | `/#/mentor?tab=sessions` | sessions |
| `/#/mentor?tab=analytics` | `/#/mentor?tab=analytics` | analytics |
| `/#/settings` | `/#/settings` | (standalone page) |

### Student (hash-based routing with sub-routes)

| Test Route | Component |
|---|---|
| `/#/student` | UserDashboard — overview |
| `/#/student/goals` | StudentGoals |
| `/#/student/tasks` | StudentTasks |
| `/#/student/journal` | StudentJournal |
| `/#/student/sessions` | StudentSessions |
| `/#/student/messages` | WhatsAppMessaging |
| `/#/student/resources` | ResourceDashboard |
| `/#/student/events` | StudentEvents |
| `/#/student/profile` | StudentEditProfile |

## Selector Patterns Used

### Application Cards (ApplicationsTab)
```typescript
// Find applicant by name text
page.getByText('QA Student One')

// Find approve button
page.locator('button[title="Approve"]')

// Find reject button
page.locator('button[title="Reject"]')
```

### Goal Cards (StudentGoals)
```typescript
// Find goal by title text
page.getByText('Complete Product Roadmap')

// Goal detail section shows milestone titles
// (no data-testid — uses text matching)
```

### Form Inputs
```typescript
// Auth form
page.getByPlaceholder('name@example.com')
page.getByPlaceholder('••••••••')

// Application form
page.locator('input[placeholder="John Doe"]')
page.locator('input[placeholder="(555) 000-0000"]')
page.locator('input[placeholder="john@example.com"]')
```

### Navigation
```typescript
// Navigation links in header
page.locator('header').getByRole('link', { name: 'MEMBERS PORTAL' })
page.locator('header').getByRole('link', { name: 'Programs' })

// Submit buttons
page.getByRole('button', { name: /next/i })
page.getByRole('button', { name: /confirm inquiry/i })
```

## Excluded Tests (Mock-based, not suitable for staging)

| Test File | Reason |
|---|---|
| `e2e/student-dashboard.spec.ts` | Uses `setupAuthMock()` and `suppressSeed()` — mocks ALL Supabase API responses |
| `e2e/debug-auth.spec.ts` | Uses localStorage mocking for auth token injection |

## Seed Data References

Tests depend on the following seeded data:

| Entity | Key Test Identifier | Student |
|---|---|---|
| Goal | "Complete Product Roadmap" | Student 1 |
| Goal | "Security+ Certification" | Student 2 |
| Task | "Submit updated resume PDF" | Student 1 |
| Task | "Security+ Practice Exam Review" | Student 2 |
| Session | "Introductory Call" | Student 1 |
| Session | "Career Strategy Session" | Student 2 |
| Resource | "PM Interview Guide" | Both |
| Event | "Networking Mixer" | Both |
| Profile | "QA Student One" / "QA Student Two" | — |

## Updating Tests

When adding new tests:
1. Check the actual DOM using Playwright Codegen or manual inspection
2. Prefer `getByRole()` and `getByText()` over CSS selectors
3. Add `{ timeout: 10000 }` for data-dependent assertions
4. Always verify with real auth storage state
5. Never add `data-testid` attributes to app source for testing
