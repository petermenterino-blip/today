import { test, expect } from '@playwright/test';

test.describe('Debug Auth', () => {
  test('check localStorage after page loads', async ({ page }) => {
    await page.addInitScript(() => {
      const now = Math.floor(Date.now() / 1000);
      localStorage.setItem('supabase.auth.token', JSON.stringify({
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
          user_metadata: { full_name: 'Test Student' },
          app_metadata: { provider: 'email' },
          created_at: '2025-01-01T00:00:00Z',
        },
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    const allKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i)!);
      }
      return keys.sort();
    });

    console.log('=== All localStorage keys ===');
    for (const k of allKeys) {
      const val = await page.evaluate((key) => {
        const v = localStorage.getItem(key);
        return v ? v.substring(0, 100) : '(empty)';
      }, k);
      console.log(`  ${k}: ${val}`);
    }

    const authToken = await page.evaluate(() => localStorage.getItem('supabase.auth.token'));
    console.log('=== supabase.auth.token after page load ===');
    console.log(authToken ? 'PRESENT' : 'MISSING');
    if (authToken) {
      const parsed = JSON.parse(authToken);
      console.log('user.id:', parsed.user?.id);
      console.log('expires_at:', parsed.expires_at, '(now:', Math.floor(Date.now() / 1000), ')');
    }
  });
});
