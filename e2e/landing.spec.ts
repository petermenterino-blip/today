import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays brand name and navigation', async ({ page }) => {
    await expect(page.getByText('Mentorino')).toBeVisible();
    await expect(page.getByRole('link', { name: 'MEMBERS PORTAL' })).toBeVisible();
  });

  test('navigation links are accessible', async ({ page }) => {
    const navLinks = ['About Mentor', 'Programs', 'Consultation', 'FAQ', 'Contact', 'Gallery'];
    for (const link of navLinks) {
      await expect(page.getByRole('link', { name: link })).toBeVisible();
    }
  });

  test('clicking Programs link navigates to /programs', async ({ page }) => {
    await page.getByRole('link', { name: 'Programs' }).click();
    await expect(page).toHaveURL(/\/programs/);
  });

  test('clicking Members Portal navigates to auth page', async ({ page }) => {
    await page.getByRole('link', { name: 'MEMBERS PORTAL' }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('hero section has CTA to apply', async ({ page }) => {
    const applyLink = page.getByRole('link', { name: /apply/i });
    await expect(applyLink.first()).toBeVisible();
  });

  test('displays footer with key links', async ({ page }) => {
    await expect(page.getByText(/privacy/i)).toBeVisible();
    await expect(page.getByText(/terms/i)).toBeVisible();
  });
});
