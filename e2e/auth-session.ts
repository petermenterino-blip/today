import type { Page } from '@playwright/test';

/**
 * Injects a mock Supabase session so the app treats the user as authenticated.
 * Must be called BEFORE page.goto() by using addInitScript.
 */
export async function mockAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    window.__MOCK_AUTH__ = {
      user: {
        id: 'mock-student-1',
        email: 'student@mentorino.com',
        role: 'authenticated',
        app_role: 'student',
        user_metadata: { full_name: 'Test Student' },
        created_at: '2025-01-01T00:00:00Z',
      },
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'mock-student-1',
          email: 'student@mentorino.com',
          role: 'authenticated',
          user_metadata: { full_name: 'Test Student' },
          created_at: '2025-01-01T00:00:00Z',
        },
      },
    };
  });
}

/**
 * Sets up Playwright route interception to mock Supabase API calls.
 * Call this in test.beforeEach before page.goto().
 */
export async function setupSupabaseMocks(page: Page) {
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

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'mock-student-1',
          email: 'student@mentorino.com',
          role: 'authenticated',
        },
      }),
    });
  });
}
