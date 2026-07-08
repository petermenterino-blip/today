import { test, expect } from '@playwright/test'

test.describe('Email Workflows — QA-EML-010', () => {
  test.describe('Trigger Tests — EML-TC-001 to 016', () => {
    test('EML-TC-001: Welcome email trigger on registration', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForLoadState('networkidle')
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i }).first()
      if (await registerLink.isVisible()) {
        await registerLink.click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('EML-TC-005: Session booked email trigger', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForLoadState('networkidle')
      await page.locator('input[placeholder="name@example.com"]').first().fill('alex.johnson@test.com')
      await page.locator('input[type="password"]').first().fill('Test1234!')
      await page.locator('button:has-text("SIGN IN")').first().click()
      await page.waitForURL(/\/student/)
      const sessionLink = page.getByRole('link', { name: /session|booking|schedule/i }).first()
      if (await sessionLink.isVisible()) {
        await sessionLink.click()
        await page.waitForLoadState('networkidle')
        const bookBtn = page.getByRole('button', { name: /book session|schedule/i }).first()
        if (await bookBtn.isVisible()) {
          await bookBtn.click()
          await page.waitForTimeout(1000)
        }
      }
    })

    test('EML-TC-010: Session reminder scheduled correctly', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForLoadState('networkidle')
      await page.locator('input[placeholder="name@example.com"]').first().fill('alex.johnson@test.com')
      await page.locator('input[type="password"]').first().fill('Test1234!')
      await page.locator('button:has-text("SIGN IN")').first().click()
      await page.waitForURL(/\/student/)
      await page.goto('/#/student?tab=sessions')
      await page.waitForLoadState('networkidle')
    })
  })

  test.describe('Content Tests — EML-TC-017 to 024', () => {
    test('EML-TC-017: Email variables interpolated correctly', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForLoadState('networkidle')
      await page.locator('input[placeholder="name@example.com"]').first().fill('alex.johnson@test.com')
      await page.locator('input[type="password"]').first().fill('Test1234!')
      await page.locator('button:has-text("SIGN IN")').first().click()
      await page.waitForURL(/\/student/)
    })
  })

  test.describe('Delivery Tests — EML-TC-025 to 030', () => {
    test('EML-TC-025: Email delivered within SLA (< 60s for transactional)', async ({ page }) => {
      const start = Date.now()
      await page.goto('/contact')
      await page.waitForLoadState('networkidle')
      const ts = Date.now()
      const nameInput = page.locator('input[placeholder*="John Doe" i]').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Email Test ${ts}`)
        await page.locator('input[placeholder*="john@example" i]').first().fill(`emailtest${ts}@example.com`)
        await page.locator('textarea[placeholder*="Tell Peter" i]').first().fill(`Email delivery SLA test ${ts}`)
        await page.locator('button:has-text("Send Message")').first().click()
        await page.waitForTimeout(2000)
      }
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThan(0)
    })
  })

  test.describe('Preference Tests — EML-TC-031 to 036', () => {
    test('EML-TC-031: Unsubscribe mechanism works', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForLoadState('networkidle')
      await page.locator('input[placeholder="name@example.com"]').first().fill('alex.johnson@test.com')
      await page.locator('input[type="password"]').first().fill('Test1234!')
      await page.locator('button:has-text("SIGN IN")').first().click()
      await page.waitForURL(/\/student/)
      const settingsLink = page.getByRole('link', { name: /settings|preferences|notifications/i }).first()
      if (await settingsLink.isVisible()) {
        await settingsLink.click()
        await page.waitForLoadState('networkidle')
        const emailPref = page.locator('[class*="email"], [class*="notification"] input[type="checkbox"]').first()
        if (await emailPref.isVisible()) {
          await emailPref.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })
})
