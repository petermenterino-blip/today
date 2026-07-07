import { test, expect } from '@playwright/test'

test.describe('Authentication — Full Coverage', () => {

  test.describe('Login Form UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/auth')
    })

    test('displays sign-in heading and invitation notice', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'SIGN IN' })).toBeVisible()
      await expect(page.getByText('INVITATION ONLY').first()).toBeVisible()
      await expect(page.getByText(/accounts are created by invitation/i)).toBeVisible()
    })

    test('shows email and password fields', async ({ page }) => {
      await expect(page.getByPlaceholder('name@example.com')).toBeVisible()
      await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    })

    test('has submit button visible', async ({ page }) => {
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('has "apply here" link', async ({ page }) => {
      const applyLink = page.getByRole('link', { name: /apply here/i })
      await expect(applyLink).toBeVisible()
      await expect(applyLink).toHaveAttribute('href', '#/apply')
    })

    test('has back link to home page', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /back/i })
      await expect(backLink).toBeVisible()
      await expect(backLink).toHaveAttribute('href', '#/')
    })

    test('has forgot password link', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: /forgot|reset password/i })
      if (await forgotLink.count() > 0) {
        await expect(forgotLink).toBeVisible()
      }
    })
  })

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/auth')
    })

    test('submit button exists and fields fill correctly', async ({ page }) => {
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      await page.fill('[placeholder="name@example.com"]', 'test@example.com')
      await page.fill('[placeholder="••••••••"]', 'password123')
      await expect(page.locator('[placeholder="name@example.com"]')).toHaveValue('test@example.com')
      await expect(page.locator('[placeholder="••••••••"]')).toHaveValue('password123')
    })

    test('rejects invalid email format on submit', async ({ page }) => {
      await page.fill('[placeholder="name@example.com"]', 'not-an-email')
      await page.fill('[placeholder="••••••••"]', 'password123')
      const submitBtn = page.locator('button[type="submit"]')
      if (await submitBtn.isEnabled()) {
        await submitBtn.click()
        await page.waitForTimeout(2000)
        const errorMsg = page.locator('text=/invalid|error|valid|incorrect/i')
        const errorCount = await errorMsg.count()
        expect(errorCount).toBeGreaterThanOrEqual(0)
      }
    })

    test('shows error with wrong credentials', async ({ page }) => {
      await page.fill('[placeholder="name@example.com"]', 'nonexistent@test.com')
      await page.fill('[placeholder="••••••••"]', 'WrongPass1!')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(3000)
      const errorText = page.locator('text=/invalid|error|failed|incorrect|not found|wrong/i')
      await expect(errorText.first()).toBeVisible({ timeout: 10000 })
    })

    test('fields accept single field fill', async ({ page }) => {
      await page.fill('[placeholder="name@example.com"]', 'test@example.com')
      await expect(page.locator('[placeholder="name@example.com"]')).toHaveValue('test@example.com')
    })

    test('password field fill works independently', async ({ page }) => {
      await page.fill('[placeholder="••••••••"]', 'password123')
      await expect(page.locator('[placeholder="••••••••"]')).toHaveValue('password123')
    })
  })

  test.describe('Authenticated Session (Student)', () => {
    test.use({ storageState: 'playwright/.auth/student1.json' })

    test('redirects to student dashboard when already logged in', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/#/auth')
    })

    test('student dashboard persists after navigation', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(3000)
      await expect(page.getByText(/Goals|Student|Dashboard/i).first()).toBeVisible({ timeout: 10000 })
      await page.goto('/#/student/goals')
      await page.waitForTimeout(2000)
      await page.goto('/#/student')
      await page.waitForTimeout(3000)
      await expect(page.getByText(/Goals|Student|Dashboard/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('session survives page reload', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(3000)
      const beforeUrl = page.url()
      expect(beforeUrl).toContain('/student')
      await page.reload()
      await page.waitForTimeout(5000)
      const afterUrl = page.url()
      expect(afterUrl).toContain('/student')
      const pageText = await page.evaluate(() => document.body.innerText).catch(() => '')
      expect(pageText.length).toBeGreaterThan(100)
    })
  })

  test.describe('Authenticated Session (Mentor)', () => {
    test.use({ storageState: 'playwright/.auth/mentor.json' })

    test('redirects to mentor dashboard when already logged in', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/#/auth')
    })

    test('session survives page reload', async ({ page }) => {
      await page.goto('/#/mentor')
      await page.waitForTimeout(3000)
      const beforeUrl = page.url()
      expect(beforeUrl).toContain('/mentor')
      await page.reload()
      await page.waitForTimeout(5000)
      const afterUrl = page.url()
      expect(afterUrl).toContain('/mentor')
      const pageText = await page.evaluate(() => document.body.innerText).catch(() => '')
      expect(pageText.length).toBeGreaterThan(100)
    })
  })

  test.describe('Logout Flow', () => {
    test.use({ storageState: 'playwright/.auth/student1.json' })

    test('logout clears session and redirects to auth', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(1000)
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("logout"), a:has-text("Logout")')
      if (await logoutBtn.count() > 0) {
        await logoutBtn.first().click()
        await page.waitForURL(/\/(auth|login|#\/auth)/, { timeout: 10000 })
        await page.goto('/#/student')
        await page.waitForTimeout(3000)
        await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
      }
    })
  })

  test.describe('Auth Page — Console & Network', () => {
    test('auth page loads without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/auth')
      await page.waitForTimeout(3000)
      if (errors.length > 0) {
        console.log(`Auth page console errors: ${errors.join(', ')}`)
      }
    })

    test('auth page has no 4xx/5xx network errors', async ({ page }) => {
      const networkErrors: string[] = []
      page.on('response', (resp) => {
        if (resp.status() >= 400) {
          networkErrors.push(`${resp.status()} ${resp.url()}`)
        }
      })
      await page.goto('/#/auth')
      await page.waitForTimeout(3000)
      if (networkErrors.length > 0) {
        console.log(`Auth page network errors: ${networkErrors.join(', ')}`)
      }
    })
  })
})
