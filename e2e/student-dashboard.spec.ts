import { test, expect } from '@playwright/test';

/**
 * Student Dashboard E2E tests.
 *
 * Strategy: intercept ALL Supabase API calls so the app never reaches the
 * real server.  Auth is bootstrapped by seeding localStorage BEFORE any
 * page script runs via addInitScript, so supabase-js picks up the session
 * during its constructor-time initialisation.
 */

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // ── 1. Seed localStorage before any app script runs ──────────────
    await page.addInitScript(() => {
      const now = Math.floor(Date.now() / 1000);
      const mockSession = {
        access_token: 'mock-student-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: now + 3600,
        refresh_token: 'mock-student-refresh-token',
        provider_token: null,
        provider_refresh_token: null,
        user: {
          id: 'mock-student-1',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'student@mentorino.com',
          email_confirmed_at: '2025-01-01T00:00:00Z',
          phone: '',
          confirmation_sent_at: '2025-01-01T00:00:00Z',
          confirmed_at: '2025-01-01T00:00:00Z',
          last_sign_in_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user_metadata: { full_name: 'Test Student' },
          app_metadata: { provider: 'email' },
        },
      };
      localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
      localStorage.setItem('supabase.auth.token-user', JSON.stringify({ user: mockSession.user }));
      localStorage.setItem('mentorino_seed_version', 'v4');
      localStorage.setItem('mentorino_sessions', JSON.stringify([]));
      localStorage.setItem('mentorino_applications', JSON.stringify([]));
      localStorage.setItem('mentorino_programs', JSON.stringify([]));
      localStorage.setItem('mock_bookings_v2', JSON.stringify([]));
      localStorage.setItem('mock_events_v2', JSON.stringify([]));
      localStorage.setItem('mentorino_resources', JSON.stringify([]));
    });

    // ── 2. Intercept ALL requests to supabase.co ─────────────────────
    await page.route((url) => url.hostname.includes('supabase.co'), async (route) => {
      const url = route.request().url();

      // Auth endpoints
      if (url.includes('/auth/v1/')) {
        // Return a valid user for session validation
        const body = url.includes('/token')
          ? {
              access_token: 'mock-student-access-token',
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              refresh_token: 'mock-student-refresh-token',
              user: { id: 'mock-student-1', email: 'student@mentorino.com', role: 'authenticated' },
            }
          : {
              id: 'mock-student-1',
              email: 'student@mentorino.com',
              role: 'authenticated',
              aud: 'authenticated',
              created_at: '2025-01-01T00:00:00Z',
              user_metadata: { full_name: 'Test Student' },
            };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        return;
      }

      // Profile endpoint
      if (url.includes('/rest/v1/profiles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'mock-student-1',
            email: 'student@mentorino.com',
            name: 'Test Student',
            first_name: 'Test',
            last_name: 'Student',
            role: 'student',
            application_status: 'approved',
            created_at: '2025-01-01T00:00:00Z',
          }]),
        });
        return;
      }

      // Goals endpoint
      if (url.includes('/rest/v1/goals')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'goal-1', student_id: 'mock-student-1', title: 'Complete Resume', description: 'Update resume', progress_percentage: 100, status: 'completed', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-15T00:00:00Z' },
            { id: 'goal-2', student_id: 'mock-student-1', title: 'Conduct Informational Interviews', description: 'Reach out to PMs', progress_percentage: 40, status: 'in_progress', created_at: '2025-06-05T00:00:00Z', updated_at: '2025-06-18T00:00:00Z' },
          ]),
        });
        return;
      }

      // All other REST endpoints
      if (url.includes('/rest/v1/')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      // Fallback
      await route.continue();
    });

    // ── 3. Navigate to student dashboard ────────────────────────────
    await page.goto('/#/student');
  });

  test('redirects to student dashboard when authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/#\/student/, { timeout: 15000 });
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  });

  test('shows sidebar with student navigation links', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    const navItems = ['Overview', 'Programs', 'Journal', 'Goals', 'Tasks', 'Sessions', 'Messages', 'Events'];
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('navigates to Goals page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Goals' }).click();
    await expect(page).toHaveURL(/#\/student\/goals/);
    await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible();
  });

  test('navigates to Tasks page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL(/#\/student\/tasks/);
    await expect(page.getByRole('heading', { name: 'Active Tasks' })).toBeVisible();
  });

  test('navigates to Journal page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Journal' }).click();
    await expect(page).toHaveURL(/#\/student\/journal/);
    await expect(page.getByRole('heading', { name: 'Your Journal' })).toBeVisible();
  });

  test('navigates to Sessions page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Sessions' }).click();
    await expect(page).toHaveURL(/#\/student\/sessions/);
  });
});
