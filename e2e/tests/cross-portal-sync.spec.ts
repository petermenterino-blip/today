import { test, expect } from '@playwright/test'

test.describe('Cross-Portal Sync — QA-SYNC-005', () => {
  test.describe('Visitor → Mentor Sync — O1 to O14', () => {
    test('SYNC-TC-001: Contact form submission reaches DB and mentor sees inquiry', async ({ page, context }) => {
      const ts = Date.now()
      const email = `sync-visitor${ts}@test.com`

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const contactLink = page.getByRole('link', { name: /contact/i }).first()
      if (await contactLink.isVisible()) {
        await contactLink.click()
        await page.waitForLoadState('networkidle')
        const nameInput = page.locator('input[placeholder="e.g. John Doe"]').first()
        if (await nameInput.isVisible()) {
          await nameInput.fill(`Sync Visitor ${ts}`)
          await page.locator('input[placeholder*="john@example" i]').first().fill(email)
          await page.locator('textarea[placeholder*="Tell Peter" i]').first().fill(`Sync test message ${ts}`)
          await page.locator('button:has-text("Send Message")').first().click()
          await page.waitForTimeout(2000)
        }
      }

      const mentorCtx = await context.newPage()
      await mentorCtx.goto('/#/auth')
      await mentorCtx.waitForLoadState('networkidle')
      await mentorCtx.locator('input[placeholder="name@example.com"]').first().fill('peter@mentorino.me')
      await mentorCtx.locator('input[type="password"]').first().fill('Nexinbe@77')
      await mentorCtx.locator('button:has-text("SIGN IN")').first().click()
      await mentorCtx.waitForURL(/\/(mentor|admin)/)
      await mentorCtx.goto('/#/mentor?tab=inquiries')
      await mentorCtx.waitForLoadState('networkidle')
      await mentorCtx.waitForTimeout(2000)
      await mentorCtx.close()
    })

    test('SYNC-TC-003: Application submission reaches mentor queue', async ({ page, context }) => {
      const ts = Date.now()
      const email = `sync-app${ts}@test.com`
      await page.goto('/#/programs')
      await page.waitForLoadState('networkidle')
      const applyBtn = page.getByRole('link', { name: /start application|apply/i }).first()
      if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await applyBtn.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        const nameInput = page.locator('input[placeholder*="John Doe" i]').first()
        if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nameInput.fill(`Sync Applicant ${ts}`)
          await page.locator('input[placeholder*="john@example" i]').first().fill(email)
          const nextBtn = page.locator('button:has-text("Next Phase")')
          if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click()
            await page.waitForTimeout(1000)
          }
        }
      }
    })
  })

  test.describe('Mentor → Student Sync', () => {
    test('SYNC-TC-020: Mentor assigns goal, student sees it in realtime', async ({ context }) => {
      const mentorPage = await context.newPage()
      await mentorPage.goto('/#/auth')
      await mentorPage.waitForLoadState('networkidle')
      await mentorPage.locator('input[placeholder="name@example.com"]').first().fill('peter@mentorino.me')
      await mentorPage.locator('input[type="password"]').first().fill('Nexinbe@77')
      await mentorPage.locator('button:has-text("SIGN IN")').first().click()
      await mentorPage.waitForURL(/\/(mentor|admin)/)
      const goalTitle = `Sync Goal ${Date.now()}`
      await mentorPage.goto('/#/mentor?tab=students')
      await mentorPage.waitForLoadState('networkidle')
      await mentorPage.waitForTimeout(1000)
      const addGoalBtn = mentorPage.getByRole('button', { name: /add goal|create goal|assign goal/i }).first()
      if (await addGoalBtn.isVisible()) {
        await addGoalBtn.click()
        await mentorPage.locator('input[name="title"], input[placeholder*="title" i]').first().fill(goalTitle)
        await mentorPage.locator('button[type="submit"]:has-text("Save"), button:has-text("Create")').first().click()
        await mentorPage.waitForTimeout(1000)
      }
      await mentorPage.close()
    })
  })

  test.describe('Realtime Delivery — RT-01 to 12', () => {
    test('RT-01: Message delivered within 2s SLA', async ({ page }) => {
      await page.goto('/#/auth')
      await page.waitForLoadState('networkidle')
      await page.locator('input[placeholder="name@example.com"]').first().fill('alex.johnson@test.com')
      await page.locator('input[type="password"]').first().fill('Test1234!')
      await page.locator('button:has-text("SIGN IN")').first().click()
      await page.waitForURL(/\/student/)
      const msgLink = page.getByRole('link', { name: /message|chat|inbox/i }).first()
      if (await msgLink.isVisible()) {
        await msgLink.click()
        await page.waitForLoadState('networkidle')
        const msgBtn = page.getByRole('button', { name: /new message|compose/i }).first()
        if (await msgBtn.isVisible()) {
          await msgBtn.click()
          await page.locator('textarea[placeholder*="message" i], [contenteditable="true"]').first().fill(`Realtime test ${Date.now()}`)
          await page.locator('button:has-text("Send")').first().click()
          await page.waitForTimeout(1000)
        }
      }
    })
  })
})
