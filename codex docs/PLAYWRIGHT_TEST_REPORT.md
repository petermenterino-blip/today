# Playwright Test Report

Audit date: 2026-07-05

## Final Bounded Run

Command scope: Chromium, two workers, excluding the database-writing application submission case.

| Metric | Result |
|---|---:|
| Tests | 29 |
| Passed | 29 |
| Failed | 0 |
| Skipped by runner | 0 |
| Flaky | 0 |
| Duration | 50.4 seconds |

One repository test was intentionally excluded: `complete full application to submission screen`. It inserts an application into the configured Supabase database and conflicts with the audit's no-database-change rule.

## Coverage

- Application form: 4 tests
- Authentication page: 4 tests
- Authentication debug fixtures: 2 tests
- Landing page: 6 tests
- Mocked student dashboard: 13 tests
- Mentor dashboard: 0 tests
- Live cross-role synchronization: 0 tests
- Live RLS/JWT enforcement: 0 tests

## Browser Matrix

The configured Chromium, Firefox, WebKit, mobile Chrome, and mobile Safari run exceeded ten minutes and was terminated. Partial failure screenshots were generated during that attempt, but the final bounded run replaced transient `test-results` content. This matrix is incomplete and is not counted as passed.

## Artifacts

- HTML report: `playwright-report/index.html`
- JSON report: `test-results/results.json`
- JUnit report: `test-results/junit.xml`
- Screenshots: `screenshots/`
- Trace: none; final run had no retry or failure.
- Failure video: none; final run had no retry or failure.
- Network/console capture: not configured as persistent attachments.
- Coverage: Playwright source coverage is not configured.

## Limitations

The student tests intercept authentication and Supabase REST calls. They verify UI rendering and navigation, not production authentication, database contracts, RLS, or realtime behavior.
