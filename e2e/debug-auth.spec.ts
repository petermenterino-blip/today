import { test } from '@playwright/test';

const STORAGE_KEY = 'sb-jnazlfhhzxrocvxvmkkc-auth-token';

test.describe('Auth Debug', () => {
  test('localStorage approach with CORRECT key', async ({ page }) => {
    await page.addInitScript((key) => {
      const now = Math.floor(Date.now() / 1000);
      const session = {
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
      localStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem('mentorino_seed_version', 'v4');
    }, STORAGE_KEY);

    await page.route((url) => url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/'), async (route) => {
      const url = route.request().url();
      if (url.includes('/rest/v1/profiles')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'mock-student-1', email: 'student@mentorino.com', name: 'Test Student', role: 'student', application_status: 'approved', created_at: '2025-01-01T00:00:00Z' }]) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/#/student');
    await page.waitForTimeout(5000);
    console.log('FINAL URL:', page.url());
  });

  test('module interception approach', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mentorino_seed_version', 'v4');
    });

    await page.route((url) => {
      const u = typeof url === 'string' ? url : url.toString();
      return u.includes('/src/services/authService.ts');
    }, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          export const authService = {
            async getCurrentUser() {
              return { data: { id: 'mock-student-1', email: 'student@mentorino.com', name: 'Test Student', role: 'student', application_status: 'approved', created_at: '2025-01-01T00:00:00Z', profile: { id: 'mock-student-1', email: 'student@mentorino.com', name: 'Test Student', role: 'student', created_at: '2025-01-01T00:00:00Z' } }, error: null };
            },
            onAuthStateChange() { return null; },
            async signIn() { return { data: null, error: 'mock not implemented' }; },
            async signUp() { return { data: null, error: 'mock not implemented' }; },
            async signOut() { return { data: undefined, error: null }; },
          };
        `,
      });
    });

    await page.route((url) => url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/'), async (route) => {
      const url = route.request().url();
      if (url.includes('/rest/v1/profiles')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'mock-student-1', email: 'student@mentorino.com', name: 'Test Student', role: 'student', application_status: 'approved', created_at: '2025-01-01T00:00:00Z' }]) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/#/student');
    await page.waitForTimeout(5000);
    console.log('FINAL URL:', page.url());
  });
});
