# Test Report

## Test Framework Configuration

### Unit Tests (Vitest)
- **Configuration:** Inline in vite.config.ts
- **Environment:** jsdom
- **Globals:** true
- **Setup file:** src/test/setup.ts
- **CSS:** true (enabled)
- **Test pattern:** `src/**/*.{test,spec}.{ts,tsx}`
- **Excluded:** e2e/, node_modules/, dist/

### E2E Tests (Playwright)
- **Configuration:** playwright.config.ts
- **Test directory:** e2e/
- **Parallel:** true
- **Retries:** CI: 2, Local: 0
- **Workers:** CI: 4, Local: 2
- **Browsers:** chromium, firefox, webkit, mobile-chrome (Pixel 9), mobile-safari (iPhone 16)
- **Dev server:** `npm run dev` on port 3000
- **Traces:** on-first-retry
- **Screenshots:** only-on-failure
- **Video:** on-first-retry

## Test Files

### Unit Tests
- `src/services/__tests__/applicationService.test.ts`
- `src/services/__tests__/authService.test.ts`
- `src/services/__tests__/taskService.test.ts`
- `src/utils/__tests__/dateUtils.test.ts`
- `src/utils/__tests__/progressUtils.test.ts`

### E2E Tests
- `e2e/auth.spec.ts`
- `e2e/debug-auth.spec.ts`
- `e2e/landing.spec.ts`
- `e2e/student-dashboard.spec.ts`
- `e2e/application.spec.ts`

### Test Utilities
- `src/test/test-utils.tsx` — Custom render with providers
- `src/test/setup.ts` — Vitest setup (MSW, matchers)
- `src/test/mocks/handlers.ts` — MSW request handlers
- `src/test/mocks/server.ts` — MSW server setup
- `e2e/helpers/auth.ts` — Auth helper for E2E

## Mock Service Worker (MSW)
- Used for API mocking in unit tests
- Handlers defined in `src/test/mocks/handlers.ts`
- Server setup in `src/test/mocks/server.ts`

## CI Test Jobs (GitHub Actions)

| Job | Command | Depends On |
|-----|---------|------------|
| typecheck | `npx tsc --noEmit` | - |
| unit-tests | `npx vitest run --coverage` | - |
| e2e-tests | `npx playwright test --project=chromium` | - |
| build | `npm run build` | typecheck, unit-tests, e2e-tests |

## Test Commands

```bash
npm test                # vitest run
npm run test:watch      # vitest (watch mode)
npm run test:coverage   # vitest run --coverage
npm run test:e2e        # playwright test
npm run test:e2e:ui     # playwright test --ui
npm run lint            # tsc --noEmit
```
