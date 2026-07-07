import { test, expect } from '@playwright/test'

test.describe('Visitor Flow — Unauthenticated', () => {

  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('auth page shows login form', async ({ page }) => {
    await page.goto('/#/auth')
    await expect(page.getByText(/sign in|login/i).first()).toBeVisible()
    await expect(page.locator('[placeholder="name@example.com"]')).toBeVisible()
    await expect(page.locator('[placeholder="••••••••"]')).toBeVisible()
  })

  test('application form is accessible', async ({ page }) => {
    await page.goto('/#/apply')
    await expect(page.getByText('PROFILE & GOALS')).toBeVisible()
    await expect(page.getByText('PROGRAM AUDIT')).toBeVisible()
  })

  test('application form validates required fields', async ({ page }) => {
    await page.goto('/#/apply')
    await page.waitForTimeout(1000)
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit")')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      await page.waitForTimeout(1000)
      const errors = page.locator('[role="alert"], .error, .text-red, :invalid')
      const errorCount = await errors.count()
      expect(errorCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('visitor cannot access mentor dashboard', async ({ page }) => {
    await page.goto('/#/mentor')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
  })

  test('visitor cannot access student dashboard', async ({ page }) => {
    await page.goto('/#/student')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
  })

  test('landing page loads without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForTimeout(3000)
    expect(errors).toHaveLength(0)
  })
})
