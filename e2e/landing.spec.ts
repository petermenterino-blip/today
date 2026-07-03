import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays brand name and navigation', async ({ page }) => {
    await expect(page.getByText('Mentorino').first()).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'MEMBERS PORTAL' })).toBeVisible();
  });

  test('navigation links are accessible in header', async ({ page }) => {
    const header = page.locator('header');
    const navLinks = ['About Mentor', 'Programs', 'Consultation', 'FAQ', 'Contact', 'Gallery'];
    for (const link of navLinks) {
      await expect(header.getByRole('link', { name: link })).toBeVisible();
    }
  });

  test('clicking Programs navigates to /programs', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Programs' }).click();
    await expect(page).toHaveURL(/#\/programs/);
  });

  test('clicking Members Portal navigates to auth page', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'MEMBERS PORTAL' }).click();
    await expect(page).toHaveURL(/#\/auth/);
  });

  test('hero section has CTA to apply', async ({ page }) => {
    const applyLink = page.getByRole('link', { name: /apply/i });
    await expect(applyLink.first()).toBeVisible();
  });

  test('displays footer with copyright and mentor portal', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText(/Mentorino/i)).toBeVisible();
    await expect(footer.getByText(/ALL RIGHTS RESERVED/i)).toBeVisible();
  });
});
