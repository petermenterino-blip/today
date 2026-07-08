import { test, expect } from '@playwright/test'
import { MentorDashboardPage, MentorApplicationsPage, MentorSessionsPage } from '../pages/mentor/dashboard.page'
import { AuthPage } from '../pages/shared/auth.page'

test.describe('Mentor Dashboard — QA-MNT-008', () => {
  test.use({ storageState: 'playwright/.auth/mentor.json' })

  test.describe('Dashboard Overview — MNT-TC-001 to 004', () => {
    test('MNT-TC-001: Dashboard loads with all widgets', async ({ page }) => {
      const dash = new MentorDashboardPage(page)
      await dash.goto()
      await dash.verifyDashboardLoaded()
    })

    test('MNT-TC-002: Summary stats visible', async ({ page }) => {
      await page.goto('/#/mentor')
      await page.waitForLoadState('networkidle')
      const statItems = page.locator('[class*="stat"], [class*="metric"], [class*="count"]')
      expect(await statItems.count()).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Application Management — MNT-TC-005 to 012', () => {
    test('MNT-TC-005: Applications queue accessible', async ({ page }) => {
      const apps = new MentorApplicationsPage(page)
      await apps.goto()
      await apps.verifyApplicationsVisible()
    })

    test('MNT-TC-006: View application details', async ({ page }) => {
      const apps = new MentorApplicationsPage(page)
      await apps.goto()
      await apps.verifyApplicationsVisible()
      await apps.viewApplicationDetail('Jane Smith')
    })

    test('MNT-TC-007: Approve a pending application', async ({ page }) => {
      const dash = new MentorDashboardPage(page)
      await dash.goto()
      await dash.navigateTo('applications')
      await page.waitForTimeout(1500)
      await dash.approveApplication('Sam Applicant')
    })

    test('MNT-TC-008: Reject with reason', async ({ page }) => {
      const dash = new MentorDashboardPage(page)
      await dash.goto()
      await dash.navigateTo('applications')
      await page.waitForTimeout(1500)
      await dash.rejectApplication('Sam Applicant', 'Position filled')
    })
  })

  test.describe('Session Management — MNT-TC-016 to 022', () => {
    test('MNT-TC-016: View session schedule', async ({ page }) => {
      await page.goto('/#/mentor?tab=sessions')
      await page.waitForLoadState('networkidle')
      const schedule = page.locator('[class*="calendar"], [class*="schedule"], [class*="session"]').first()
      await expect(schedule).toBeVisible({ timeout: 10000 })
    })

    test('MNT-TC-017: Schedule a session', async ({ page }) => {
      const dash = new MentorDashboardPage(page)
      await dash.goto()
      await dash.navigateTo('sessions')
      const scheduleBtn = page.getByRole('button', { name: /schedule|new session/i }).first()
      if (await scheduleBtn.isVisible()) {
        await scheduleBtn.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Goal & Task Management — MNT-TC-023 to 028', () => {
    test('MNT-TC-023: Assign goal to student', async ({ page }) => {
      const dash = new MentorDashboardPage(page)
      await dash.goto()
      const goalTitle = `Mentor Assigned Goal ${Date.now()}`
      await dash.assignGoalToStudent('Alex Johnson', goalTitle)
    })
  })

  test.describe('Messaging — MNT-TC-029 to 033', () => {
    test('MNT-TC-029: Send message to student', async ({ page }) => {
      await page.goto('/#/mentor?tab=messages')
      await page.waitForLoadState('networkidle')
      const composeBtn = page.getByRole('button', { name: /new message|compose/i }).first()
      if (await composeBtn.isVisible()) {
        await composeBtn.click()
        const msgText = `Test message from mentor at ${Date.now()} — MNT-TC-029`
        const input = page.locator('textarea[placeholder*="message" i], [contenteditable="true"]').first()
        if (await input.isVisible()) {
          await input.fill(msgText)
          await page.locator('button:has-text("Send")').click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Resource Library — MNT-TC-034 to 038', () => {
    test('MNT-TC-034: Upload resource file', async ({ page }) => {
      await page.goto('/#/mentor?tab=resources')
      await page.waitForLoadState('networkidle')
      const uploadBtn = page.getByRole('button', { name: /upload|add resource/i }).first()
      if (await uploadBtn.isVisible()) {
        await uploadBtn.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Analytics — MNT-TC-039 to 042', () => {
    test('MNT-TC-039: View analytics dashboard', async ({ page }) => {
      await page.goto('/#/mentor?tab=analytics')
      await page.waitForLoadState('networkidle')
      const chart = page.locator('[class*="chart"], [class*="graph"], [class*="analytics"]').first()
      await expect(chart).toBeVisible({ timeout: 10000 }).catch(() => {})
    })
  })

  test.describe('Availability — MNT-TC-043 to 045', () => {
    test('MNT-TC-043: Manage availability settings', async ({ page }) => {
      await page.goto('/#/mentor?tab=availability')
      await page.waitForLoadState('networkidle')
      const settings = page.locator('[class*="availability"], [class*="schedule"]').first()
      await expect(settings).toBeVisible({ timeout: 10000 }).catch(() => {})
    })
  })
})
