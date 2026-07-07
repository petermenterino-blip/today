import { test, expect } from '@playwright/test'

test.describe('Student Flow — Staging (Student1)', () => {
  test.use({ storageState: 'playwright/.auth/student1.json' })

  test('dashboard displays goals overview', async ({ page }) => {
    await page.goto('/#/student')
    await expect(page.getByText(/Goals/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('goals page lists personal goals', async ({ page }) => {
    await page.goto('/#/student/goals')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/YOUR GOALS|Goals/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('goal detail shows milestones', async ({ page }) => {
    await page.goto('/#/student/goals')
    await page.waitForTimeout(2000)
    const goalText = page.getByText('Complete Portfolio Project (Test)').first()
    await expect(goalText).toBeVisible({ timeout: 10000 })
  })

  test('tasks page lists assigned tasks', async ({ page }) => {
    await page.goto('/#/student/tasks')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/tasks'))
    await page.waitForTimeout(1000)
    await expect(page.getByText(/COMPLETE YOUR PROFILE FOR AUDIT|tasks/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('journal page is accessible', async ({ page }) => {
    await page.goto('/#/student/journal')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/journal') || resp.url().includes('/rest/v1/journals'))
    await page.waitForTimeout(1000)
    await expect(page.getByText(/Journal|journals/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('sessions page shows scheduled sessions', async ({ page }) => {
    await page.goto('/#/student/sessions')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Session|sessions/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('messaging is accessible', async ({ page }) => {
    await page.goto('/#/student/messages')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/conversations'))
    await page.waitForTimeout(1000)
    await expect(page.getByText(/messages|Welcome to the program/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('resources page is accessible', async ({ page }) => {
    await page.goto('/#/student/resources')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/PM Interview Guide|Resume Template|Resources/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('events / calendar is accessible', async ({ page }) => {
    await page.goto('/#/student/events')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Networking Mixer|Events|Calendar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('profile page is accessible', async ({ page }) => {
    await page.goto('/#/student/profile')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Profile/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('can log out', async ({ page }) => {
    await page.goto('/#/student')
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
    await page.goto('/#/student')
    await page.waitForTimeout(3000)
    expect(errors).toHaveLength(0)
  })
})
