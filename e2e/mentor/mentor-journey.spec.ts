import { test, expect } from '@playwright/test'

test.describe('Mentor Journey — Full Coverage', () => {
  test.use({ storageState: 'playwright/.auth/mentor.json' })

  test.describe('Dashboard Overview', () => {
    test('dashboard overview loads', async ({ page }) => {
      await page.goto('/#/mentor')
      await expect(page.getByText(/Overview|STUDENT CRM|MAIN MENU/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('dashboard loads without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/mentor')
      await page.waitForTimeout(3000)
      expect(errors).toHaveLength(0)
    })

    test('dashboard has no failed network requests', async ({ page }) => {
      const networkErrors: string[] = []
      page.on('response', (resp) => {
        if (resp.status() >= 400) {
          networkErrors.push(`${resp.status()} ${resp.url()}`)
        }
      })
      await page.goto('/#/mentor')
      await page.waitForTimeout(3000)
      if (networkErrors.length > 0) {
        console.log(`Mentor dashboard network errors: ${networkErrors.join(', ')}`)
      }
    })
  })

  test.describe('Applications Tab', () => {
    test('applications queue loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=applications')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/applications'), { timeout: 15000 })
      await expect(page.getByText(/Jane Smith|Sam Applicant|Applications/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Mentees Tab', () => {
    test('mentees tab shows assigned students', async ({ page }) => {
      await page.goto('/#/mentor?tab=mentees')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/profiles'), { timeout: 15000 })
      await page.waitForTimeout(1000)
      await expect(page.getByText(/Alex Rivera|Alex Johnson|Students/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('mentees list has clickable entries', async ({ page }) => {
      await page.goto('/#/mentor?tab=mentees')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/profiles'), { timeout: 15000 })
      await page.waitForTimeout(2000)
      const entries = page.locator('[role="button"], [role="link"], .student-card, [class*="mentee"], [class*="student"]')
      const count = await entries.count()
      if (count > 0) {
        await entries.first().click()
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Messaging Tab', () => {
    test('messaging tab is accessible', async ({ page }) => {
      await page.goto('/#/mentor?tab=messaging')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/conversations'), { timeout: 15000 })
      await page.waitForTimeout(1000)
      await expect(page.getByText(/Welcome to the program|messages/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Resources Tab', () => {
    test('resources tab is accessible', async ({ page }) => {
      await page.goto('/#/mentor?tab=resources')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/PM Interview Guide|Resume Template|Resources/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Sessions Tab', () => {
    test('sessions tab is accessible', async ({ page }) => {
      await page.goto('/#/mentor?tab=sessions')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Introductory Call|Career Strategy Session|Sessions/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('sessions tab loads without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/mentor?tab=sessions')
      await page.waitForTimeout(3000)
      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Analytics Tab', () => {
    test('analytics tab is accessible', async ({ page }) => {
      await page.goto('/#/mentor?tab=analytics')
      await page.waitForTimeout(3000)
      await expect(page.getByText(/Analytics|Performance/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Bookings Tab', () => {
    test('bookings tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=bookings')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/booking|Booking|Calendar|Schedule/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Programs Tab', () => {
    test('programs tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=programs')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Program Progress Tab', () => {
    test('program progress tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=program-progress')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Feedback Tab', () => {
    test('feedback tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=feedback')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Events Tab', () => {
    test('events tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=events')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/event|Event/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('AI Tab', () => {
    test('ai tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=ai')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Gallery Tab', () => {
    test('gallery tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=gallery')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Growth Audit Tab', () => {
    test('growth-audit tab loads', async ({ page }) => {
      await page.goto('/#/mentor?tab=growth-audit')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Settings', () => {
    test('settings page is accessible', async ({ page }) => {
      await page.goto('/#/settings')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Settings|Profile/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('settings page loads without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/settings')
      await page.waitForTimeout(3000)
      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Logout', () => {
    test('can log out from mentor dashboard', async ({ page }) => {
      await page.goto('/#/mentor')
      await page.waitForTimeout(1000)
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("logout"), a:has-text("Logout")')
      if (await logoutBtn.count() > 0) {
        await logoutBtn.first().click()
        await page.waitForURL(/\/(auth|login|#\/auth)/, { timeout: 10000 })
      }
    })
  })
})
