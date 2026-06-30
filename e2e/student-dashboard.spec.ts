import { test, expect } from '@playwright/test';

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase auth & data requests to return mock student session
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-student-1',
          email: 'student@mentorino.com',
          role: 'authenticated',
          aud: 'authenticated',
          created_at: '2025-01-01T00:00:00Z',
          user_metadata: { full_name: 'Test Student' },
        }),
      });
    });

    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: 'mock-student-1', email: 'student@mentorino.com', role: 'authenticated' },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'mock-student-1',
          email: 'student@mentorino.com',
          name: 'Test Student',
          role: 'student',
          created_at: '2025-01-01T00:00:00Z',
        }]),
      });
    });

    // Catch-all for other Supabase requests (goals, tasks, sessions, etc.)
    await page.route('**/supabase.co/rest/v1/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/#/student');
  });

  test('redirects to student dashboard when authenticated', async ({ page }) => {
    // Should load the dashboard instead of being redirected to /auth
    await expect(page).toHaveURL(/#\/student/);
    await expect(page.getByText(/loading workspac/i)).not.toBeVisible({ timeout: 8000 });
  });

  test('shows sidebar with navigation links', async ({ page }) => {
    await expect(page.getByText(/loading workspac/i)).not.toBeVisible({ timeout: 8000 });
    const navItems = ['Overview', 'Programs', 'Journal', 'Goals', 'Tasks', 'Sessions', 'Messages', 'Events'];
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('navigates to goals page', async ({ page }) => {
    await expect(page.getByText(/loading workspac/i)).not.toBeVisible({ timeout: 8000 });
    await page.getByRole('link', { name: 'Goals' }).click();
    await expect(page).toHaveURL(/#\/student\/goals/);
    await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible();
  });

  test('navigates to tasks page', async ({ page }) => {
    await expect(page.getByText(/loading workspac/i)).not.toBeVisible({ timeout: 8000 });
    await page.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL(/#\/student\/tasks/);
  });

  test('navigates to journal page', async ({ page }) => {
    await expect(page.getByText(/loading workspac/i)).not.toBeVisible({ timeout: 8000 });
    await page.getByRole('link', { name: 'Journal' }).click();
    await expect(page).toHaveURL(/#\/student\/journal/);
    await expect(page.getByRole('heading', { name: 'Your Journal' })).toBeVisible();
  });
});
