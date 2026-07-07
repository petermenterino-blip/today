import { test, expect } from '@playwright/test'

test.describe('Student Isolation — Student2', () => {
  test.use({ storageState: 'playwright/.auth/student2.json' })

  test('dashboard shows own goals', async ({ page }) => {
    await page.goto('/#/student/goals')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Security\+ Certification/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('cannot see Student1 goals', async ({ page }) => {
    await page.goto('/#/student/goals')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Product Roadmap/i)).toHaveCount(0)
  })

  test('tasks page shows own tasks', async ({ page }) => {
    await page.goto('/#/student')
    await page.waitForResponse((resp) => resp.url().includes('/rest/v1/tasks'))
    await page.waitForTimeout(1000)
    await expect(page.getByText(/Security\+ Practice/i).first()).toBeVisible()
  })

  test('dashboard loads without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/#/student')
    await page.waitForTimeout(3000)
    expect(errors).toHaveLength(0)
  })
})
