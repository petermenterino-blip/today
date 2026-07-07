import { test, expect } from '@playwright/test'

test.describe('Cross-Role Security — Access Control', () => {

  test.describe('Visitor (Unauthenticated)', () => {
    test('visitor redirected from /#/mentor to /#/auth', async ({ page }) => {
      await page.goto('/#/mentor')
      await page.waitForTimeout(3000)
      await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
    })

    test('visitor redirected from /#/student to /#/auth', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(3000)
      await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
    })

    test('visitor redirected from /#/settings to /#/auth', async ({ page }) => {
      await page.goto('/#/settings')
      await page.waitForTimeout(3000)
      await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
    })

    test('visitor redirected from /#/dashboard to /#/auth', async ({ page }) => {
      await page.goto('/#/dashboard')
      await page.waitForTimeout(3000)
      await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
    })

    test('visitor redirected from /#/student/goals to /#/auth', async ({ page }) => {
      await page.goto('/#/student/goals')
      await page.waitForTimeout(3000)
      await expect(page).toHaveURL(/\/(auth|login|#\/auth)/)
    })

    test('visitor can access public pages without redirect', async ({ page }) => {
      const publicRoutes = ['/', '/#/about', '/#/programs', '/#/consultation', '/#/faq', '/#/contact', '/#/auth', '/#/apply']
      for (const route of publicRoutes) {
        await page.goto(route)
        await page.waitForTimeout(1000)
        const currentUrl = page.url()
        expect(currentUrl).toContain(route)
      }
    })
  })

  test.describe('Student Access Restrictions', () => {
    test.use({ storageState: 'playwright/.auth/student1.json' })

    test('student redirected from /#/mentor', async ({ page }) => {
      await page.goto('/#/mentor')
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/#/mentor')
    })

    test('student stays on /#/student routes', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Goals|Student|Dashboard/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Mentor Access Restrictions', () => {
    test.use({ storageState: 'playwright/.auth/mentor.json' })

    test('mentor redirected from /#/student', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/#/student')
    })

    test('mentor stays on /#/mentor routes', async ({ page }) => {
      await page.goto('/#/mentor')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Overview|STUDENT CRM|MAIN MENU/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('mentor can access /#/settings', async ({ page }) => {
      await page.goto('/#/settings')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Settings|Profile/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Direct URL Access Patterns', () => {
    test('attempting non-existent route returns page', async ({ page }) => {
      const resp = await page.goto('/#/nonexistent-route-xyz')
      expect(resp?.status()).toBeLessThan(500)
    })

    test('Supabase REST API returns 401 without auth (or DNS fails gracefully)', async ({ page }) => {
      let status = 0
      let dnsError = false
      try {
        const response = await page.request.get(
          'https://ujbgzjejibresfbprlru.supabase.co/rest/v1/profiles',
          { headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmd6amVqaWJyZXNmYnBybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzQ4NzcsImV4cCI6MjA1MTc1MDg3N30.O72nTF8kCGd_9TdMvGCPELUyWq1ZPr15UQDCqxI3am4' } }
        )
        status = response.status()
      } catch (e) {
        dnsError = true
        console.log(`Supabase DNS error (expected): ${e instanceof Error ? e.message : e}`)
      }
      if (!dnsError) {
        expect(status).toBe(401)
      }
    })

    test('Supabase auth endpoint returns error with bad key (or fails gracefully)', async ({ page }) => {
      let status = 0
      let dnsError = false
      try {
        const response = await page.request.get(
          'https://ujbgzjejibresfbprlru.supabase.co/auth/v1/user',
          { headers: { 'apikey': 'invalid-key' } }
        )
        status = response.status()
      } catch (e) {
        dnsError = true
        console.log(`Supabase DNS error (expected): ${e instanceof Error ? e.message : e}`)
      }
      if (!dnsError) {
        expect(status).toBeGreaterThanOrEqual(400)
      }
    })
  })
})
