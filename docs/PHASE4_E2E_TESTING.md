# Phase 4 — E2E Testing Strategy

## Scope

End-to-end tests covering the full cross-role flow in the staging environment:

```
Visitor → Apply → Mentor approves → Student login → Mentor dashboard → 
Messaging → Goals → Tasks → Sessions → Logout
```

## Test Accounts

See `docs/TEST_USERS.md` for permanent QA credentials.

All staging tests use **real authentication** (no mocks). The `auth.setup.ts` file stores authenticated browser state for each role.

## Test Files

| File                  | Role    | Key Scenarios                                    |
|-----------------------|---------|--------------------------------------------------|
| `auth.setup.ts`       | All     | Authenticate as mentor, student                  |
| `mentor-flow.spec.ts` | Mentor  | Login, review applications, approve via Edge     |
| `mentor-flow.spec.ts` | Mentor  | Login, dashboard, tasks, sessions, messaging     |
| `student-flow.spec.ts`| Student | Login, dashboard, goals, journals, messaging     |

## Running

```bash
# All staging tests (requires staging server running)
npx playwright test --project=chromium

# Single role flow
npx playwright test e2e/admin-flow.spec.ts --project=chromium
npx playwright test e2e/mentor-flow.spec.ts --project=chromium
npx playwright test e2e/student-flow.spec.ts --project=chromium

# All browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

## Environment Variables

Set before running:

| Variable          | Description                    |
|-------------------|--------------------------------|
| `BASE_URL`        | Staging URL (default `http://localhost:3000`) |
| `STAGING_EMAIL`   | QA mentor email (CI only)       |
| `STAGING_PASSWORD`| QA mentor password (CI only)    |

## CI Integration

The `auth.setup.ts` file loads credentials from environment variables. In CI:

```yaml
- run: npx playwright test
  env:
    BASE_URL: https://staging.mentorino.com
    STAGING_EMAIL: qa.mentor@mentorino.com
    STAGING_PASSWORD: ${{ secrets.STAGING_PASSWORD }}
```

## Mock Isolation

Existing mock-based tests (landing, auth form validation, application form fill) remain unchanged. The new staging tests are the only tests that use real credentials — isolated from all other test files.
