import { test, expect } from '@playwright/test';

test.describe('Auth Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/auth');
  });

  test('displays sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'SIGN IN' })).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('shows invitation only notice', async ({ page }) => {
    await expect(page.getByText('INVITATION ONLY').first()).toBeVisible();
    await expect(page.getByText(/accounts are created by invitation/i)).toBeVisible();
  });

  test('has link to apply for new account', async ({ page }) => {
    const applyLink = page.getByRole('link', { name: /apply here/i });
    await expect(applyLink).toBeVisible();
    await expect(applyLink).toHaveAttribute('href', '#/apply');
  });

  test('has back link to home page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /back/i })).toBeVisible();
  });
});
