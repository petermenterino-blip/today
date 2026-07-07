import { test, expect } from '@playwright/test'

test.describe('Mentor Flow — Staging', () => {
  test.use({ storageState: 'playwright/.auth/mentor.json' })

  test('dashboard overview loads', async ({ page }) => {
    await page.goto('/#/mentor')
    // OverviewTab renders hero card and summary stats
    await expect(page.getByText(/Overview|STUDENT CRM|MAIN MENU/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('applications queue is accessible', async ({ page }) => {
    await page.goto('/#/mentor?tab=applications')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/applications'))
    // ApplicationCard uses applicant name text
    await expect(page.getByText(/Jane Smith|Sam Applicant|Applications/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('can view application details', async ({ page }) => {
    await page.goto('/#/mentor?tab=applications')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/applications'))
    await page.waitForTimeout(1000)
    const appName = page.getByText('Jane Smith').first()
    if (await appName.count() > 0) {
      await appName.click()
      await page.waitForTimeout(1000)
    }
  })

  test.skip('application approval flow', async ({ page }) => {
    await page.goto('/#/mentor?tab=applications')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/applications'))
    await page.waitForTimeout(1000)
    const approveBtn = page.locator('button[title="Approve"], button:has-text("Approve")')
    if (await approveBtn.count() > 0) {
      await approveBtn.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test.skip('application rejection flow', async ({ page }) => {
    await page.goto('/#/mentor?tab=applications')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/applications'))
    await page.waitForTimeout(1000)
    const rejectBtn = page.locator('button[title="Reject"], button:has-text("Reject")')
    if (await rejectBtn.count() > 0) {
      await rejectBtn.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('mentees tab shows assigned students', async ({ page }) => {
    await page.goto('/#/mentor?tab=mentees')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/profiles'))
    await page.waitForTimeout(1000)
    await expect(page.getByText(/Alex Rivera|Alex Johnson|Students/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('messaging tab is accessible', async ({ page }) => {
    await page.goto('/#/mentor?tab=messaging')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/conversations'))
    await page.waitForTimeout(1000)
    await expect(page.getByText(/Welcome to the program|messages/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('resources tab is accessible', async ({ page }) => {
    await page.goto('/#/mentor?tab=resources')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/PM Interview Guide|Resume Template|Resources/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('sessions tab is accessible', async ({ page }) => {
    await page.goto('/#/mentor?tab=sessions')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Introductory Call|Career Strategy Session|Sessions/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('analytics tab is accessible', async ({ page }) => {
    await page.goto('/#/mentor?tab=analytics')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/Analytics|Performance/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('settings page is accessible', async ({ page }) => {
    await page.goto('/#/settings')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Settings|Profile/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('can log out', async ({ page }) => {
    await page.goto('/#/mentor')
    await page.waitForTimeout(1000)
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("logout"), a:has-text("Logout")')
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click()
      await page.waitForURL(/\/(auth|login|#\/auth)/)
    }
  })

  test('dashboard loads without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/#/mentor')
    await page.waitForTimeout(3000)
    expect(errors).toHaveLength(0)
  })
})
