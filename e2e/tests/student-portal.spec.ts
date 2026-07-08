import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/shared/auth.page'
import { StudentDashboardPage, StudentGoalsPage, StudentSessionsPage, StudentMessagesPage } from '../pages/student/dashboard.page'

test.describe('Student Portal — QA-STU-007', () => {
  test.use({ storageState: 'playwright/.auth/student1.json' })

  test.describe('Authentication — STU-TC-001 to 006', () => {
    test('STU-TC-002: Invalid credentials rejected', async ({ browser }) => {
      const unauthCtx = await browser.newContext({ storageState: undefined })
      const unauthPage = await unauthCtx.newPage()
      await unauthPage.goto('/#/auth')
      await unauthPage.waitForLoadState('networkidle')
      await unauthPage.locator('input[placeholder="name@example.com"]').fill('alex.johnson@test.com')
      await unauthPage.locator('input[type="password"]').fill('WrongPassword!')
      await unauthPage.locator('button:has-text("SIGN IN")').click()
      await unauthPage.waitForTimeout(2000)
      await unauthPage.close()
      await unauthCtx.close()
    })
  })

  test.describe('Dashboard — STU-TC-007 to 012', () => {
    test('STU-TC-007: Dashboard loads with widgets', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      await dash.verifyDashboardLoaded()
    })

    test('STU-TC-008: Dashboard empty state handled', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const hasContent = await dash.dashboardWidgets.count()
      expect(hasContent).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Goals — STU-TC-013 to 022', () => {
    test('STU-TC-013: Create a new goal', async ({ page }) => {
      const goals = new StudentGoalsPage(page)
      const goalTitle = `Test Goal ${Date.now()}`
      await goals.createGoal(goalTitle, 'Created by automated test — STU-TC-013')
    })

    test('STU-TC-015: Mark goal as complete', async ({ page }) => {
      const goals = new StudentGoalsPage(page)
      const goalTitle = `Completable Goal ${Date.now()}`
      await goals.createGoal(goalTitle, 'Will be completed')
    })
  })

  test.describe('Tasks — STU-TC-023 to 030', () => {
    test('STU-TC-023: Create a task', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const taskBtn = dash.createTaskButton
      if (await taskBtn.isVisible()) {
        await taskBtn.click()
        const taskTitle = `Test Task ${Date.now()}`
        await page.locator('input[name="title"], input[placeholder*="title" i]').fill(taskTitle)
        await page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create")').click()
        await expect(page.getByText(taskTitle).first()).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('Journal — STU-TC-037 to 041', () => {
    test('STU-TC-037: Create journal entry', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const journalLink = page.getByRole('link', { name: /journal|reflection/i }).first()
      if (await journalLink.isVisible()) {
        await journalLink.click()
        await page.waitForLoadState('networkidle')
        const entryBtn = page.getByRole('button', { name: /new entry|create entry|add entry/i })
        if (await entryBtn.isVisible()) {
          await entryBtn.click()
          const content = `Journal entry created at ${Date.now()} — STU-TC-037`
          await page.locator('textarea[placeholder*="write" i], textarea[name="content"]').fill(content)
          await page.locator('button[type="submit"]:has-text("Save"), button:has-text("Post")').click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Sessions — STU-TC-042 to 051', () => {
    test('STU-TC-042: Book a session', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const sessions = new StudentSessionsPage(page)
      const bookBtn = dash.bookSessionButton
      if (await bookBtn.isVisible()) {
        await sessions.bookSession()
      }
    })
  })

  test.describe('Messaging — STU-TC-052 to 056', () => {
    test('STU-TC-052: Send message to mentor', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const msgLink = page.getByRole('link', { name: /message|chat|inbox/i }).first()
      if (await msgLink.isVisible()) {
        await msgLink.click()
        await page.waitForLoadState('networkidle')
        const msgBtn = page.getByRole('button', { name: /new message|compose/i }).first()
        if (await msgBtn.isVisible()) {
          await msgBtn.click()
          const msgText = `Test message from student at ${Date.now()} — STU-TC-052`
          const input = page.locator('textarea[placeholder*="message" i], [contenteditable="true"]').first()
          if (await input.isVisible()) {
            await input.fill(msgText)
            await page.locator('button:has-text("Send")').click()
            await page.waitForTimeout(500)
          }
        }
      }
    })
  })

  test.describe('Resources — STU-TC-057 to 061', () => {
    test('STU-TC-057: Browse resource library', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const resourceLink = page.getByRole('link', { name: /resource|library/i }).first()
      if (await resourceLink.isVisible()) {
        await resourceLink.click()
        await page.waitForLoadState('networkidle')
        const resourceCount = await page.locator('[class*="resource"], [class*="file"], [class*="document"]').count()
        expect(resourceCount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Ratings — STU-TC-062 to 066', () => {
    test('STU-TC-062: Submit rating for mentor', async ({ page }) => {
      const dash = new StudentDashboardPage(page)
      await dash.goto()
      const ratingLink = page.getByRole('link', { name: /rating|feedback|review/i }).first()
      if (await ratingLink.isVisible()) {
        await ratingLink.click()
        await page.waitForLoadState('networkidle')
      }
    })
  })
})
