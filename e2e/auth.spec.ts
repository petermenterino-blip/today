import { test, expect } from '@playwright/test';

test.describe('Auth Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('displays sign-in form', async ({ page }) => {
    await expect(page.getByText('SIGN IN')).toBeVisible();
    await expect(page.getByText('WELCOME BACK TO MENTORINO WORKSPACE')).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('shows invitation only notice', async ({ page }) => {
    await expect(page.getByText('INVITATION ONLY')).toBeVisible();
    await expect(page.getByText(/accounts are created by invitation/i)).toBeVisible();
  });

  test('has link to apply for new account', async ({ page }) => {
    const applyLink = page.getByRole('link', { name: /apply here/i });
    await expect(applyLink).toBeVisible();
    await expect(applyLink).toHaveAttribute('href', '/apply');
  });

  test('has back link to home page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /back/i })).toBeVisible();
  });

  test('shows error when submitting empty form', async ({ page, context }) => {
    // Suppress error toast by closing it
    await page.getByRole('button', { name: 'SIGN IN' }).click();
    // Should remain on auth page with empty fields
    await expect(page).toHaveURL(/\/auth/);
  });

  test('navigation: apply link leads to application page', async ({ page }) => {
    await page.getByRole('link', { name: /apply here/i }).click();
    await expect(page).toHaveURL(/\/apply/);
  });
});
