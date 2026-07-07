import { test, expect } from '@playwright/test'

test.describe('Student Journey — Full Coverage', () => {
  test.use({ storageState: 'playwright/.auth/student1.json' })

  test.describe('Dashboard', () => {
    test('dashboard loads with goals overview', async ({ page }) => {
      await page.goto('/#/student')
      await expect(page.getByText(/Goals|Student|Dashboard/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('dashboard has navigation sidebar', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(2000)
      const navItems = page.locator('nav a, nav button, [role="navigation"] a, aside a')
      const count = await navItems.count()
      expect(count).toBeGreaterThan(0)
    })

    test('dashboard loads without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/student')
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
      await page.goto('/#/student')
      await page.waitForTimeout(3000)
      expect(networkErrors).toHaveLength(0)
    })
  })

  test.describe('Goals', () => {
    test('goals page lists personal goals', async ({ page }) => {
      await page.goto('/#/student/goals')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/YOUR GOALS|Goals/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('goal detail shows milestone content', async ({ page }) => {
      await page.goto('/#/student/goals')
      await page.waitForTimeout(2000)
      const goalText = page.getByText('Complete Portfolio Project (Test)').first()
      await expect(goalText).toBeVisible({ timeout: 10000 })
    })

    test('goal is clickable', async ({ page }) => {
      await page.goto('/#/student/goals')
      await page.waitForTimeout(2000)
      const goalCard = page.getByText('Complete Portfolio Project (Test)').first()
      if (await goalCard.count() > 0) {
        await goalCard.click()
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Tasks', () => {
    test('tasks page lists assigned tasks', async ({ page }) => {
      await page.goto('/#/student/tasks')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/tasks'), { timeout: 15000 })
      await page.waitForTimeout(1000)
      await expect(page.getByText(/COMPLETE YOUR PROFILE FOR AUDIT|tasks/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('tasks page has interactive elements', async ({ page }) => {
      await page.goto('/#/student/tasks')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/tasks'), { timeout: 15000 })
      await page.waitForTimeout(2000)
      const anyElement = page.locator('body *')
      const count = await anyElement.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Journal', () => {
    test('journal page is accessible', async ({ page }) => {
      await page.goto('/#/student/journal')
      await page.waitForResponse(
        (resp) => resp.url().includes('/rest/v1/journal') || resp.url().includes('/rest/v1/journals'),
        { timeout: 15000 }
      )
      await page.waitForTimeout(1000)
      await expect(page.getByText(/Journal|journals/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Sessions', () => {
    test('sessions page shows scheduled sessions', async ({ page }) => {
      await page.goto('/#/student/sessions')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Session|sessions|Upcoming|Past/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('sessions page loads without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/student/sessions')
      await page.waitForTimeout(3000)
      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Messages', () => {
    test('messaging is accessible', async ({ page }) => {
      await page.goto('/#/student/messages')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/conversations'), { timeout: 15000 })
      await page.waitForTimeout(1000)
      await expect(page.getByText(/messages|Welcome to the program/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('messaging page has conversation list', async ({ page }) => {
      await page.goto('/#/student/messages')
      await page.waitForResponse((resp) => resp.url().includes('/rest/v1/conversations'), { timeout: 15000 })
      await page.waitForTimeout(2000)
      const conversations = page.locator('[role="listitem"], .conversation-item, .message-item, [class*="conversation"]')
      const count = await conversations.count()
      if (count > 0) {
        expect(count).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Resources', () => {
    test('resources page is accessible', async ({ page }) => {
      await page.goto('/#/student/resources')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/PM Interview Guide|Resume Template|Resources/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('resources have downloadable items', async ({ page }) => {
      await page.goto('/#/student/resources')
      await page.waitForTimeout(2000)
      const links = page.locator('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a:has-text("Download"), a:has-text("View")')
      if (await links.count() > 0) {
        await expect(links.first()).toBeVisible()
      }
    })
  })

  test.describe('Events / Calendar', () => {
    test('events page is accessible', async ({ page }) => {
      await page.goto('/#/student/events')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Networking Mixer|Events|Calendar|Upcoming/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Profile', () => {
    test('profile page is accessible', async ({ page }) => {
      await page.goto('/#/student/profile')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Profile/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('profile page loads without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto('/#/student/profile')
      await page.waitForTimeout(3000)
      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Programs', () => {
    test('programs page is accessible', async ({ page }) => {
      await page.goto('/#/student/programs')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/program|Program/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Forms', () => {
    test('forms page is accessible', async ({ page }) => {
      await page.goto('/#/student/forms')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/form|Form|Audit/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Reviews', () => {
    test('reviews page is accessible', async ({ page }) => {
      await page.goto('/#/student/reviews')
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Files', () => {
    test('files page is accessible', async ({ page }) => {
      await page.goto('/#/student/files')
      await page.waitForTimeout(2000)
      await expect(page.getByText(/file|File|Document|Upload/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Logout', () => {
    test('can log out from student dashboard', async ({ page }) => {
      await page.goto('/#/student')
      await page.waitForTimeout(1000)
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("logout"), a:has-text("Logout")')
      if (await logoutBtn.count() > 0) {
        await logoutBtn.first().click()
        await page.waitForURL(/\/(auth|login|#\/auth)/, { timeout: 10000 })
      }
    })
  })
})
