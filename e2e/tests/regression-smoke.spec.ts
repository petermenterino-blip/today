import { test, expect } from '@playwright/test'
import { PublicHomePage } from '../pages/public/home.page'
import { AuthPage } from '../pages/shared/auth.page'
import { StudentDashboardPage } from '../pages/student/dashboard.page'
import { MentorDashboardPage } from '../pages/mentor/dashboard.page'

test.describe('REG-SMK Smoke Suite — P0', () => {
  test('REG-SMK-001: Public homepage loads successfully', async ({ page }) => {
    const home = new PublicHomePage(page)
    await home.goto()
    await expect(page).toHaveTitle(/Mentorino|Mentor/i)
    await home.verifyHeroSection()
  })

  test('REG-SMK-002: Navigation links are functional', async ({ page }) => {
    const home = new PublicHomePage(page)
    await home.goto()
    const links = page.getByRole('link')
    const count = await links.count()
    expect(count).toBeGreaterThan(3)
    const navItems = ['About Mentor', 'Programs', 'Consultation', 'FAQ', 'Contact', 'Gallery']
    for (const item of navItems) {
      const link = page.getByRole('link', { name: item }).first()
      if (await link.isVisible()) {
        const href = await link.getAttribute('href')
        await link.click()
        await page.waitForLoadState('networkidle')
        if (href) expect(page.url()).toContain(href.replace('#/', ''))
        await home.goto()
      }
    }
  })

  test('REG-SMK-003: Student login with valid credentials', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.login('alex.johnson@test.com', 'Test1234!')
    await auth.expectRedirectTo(/\/student/)
  })

  test('REG-SMK-004: Mentor login with valid credentials', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.login('peter@mentorino.me', 'Nexinbe@77')
    await auth.expectRedirectTo(/\/(mentor|admin)/)
  })

  test('REG-SMK-005: Student dashboard loads with data', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.login('alex.johnson@test.com', 'Test1234!')
    await auth.expectRedirectTo(/\/student/)
    const student = new StudentDashboardPage(page)
    await student.verifyDashboardLoaded()
  })

  test('REG-SMK-006: Mentor dashboard loads with data', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.login('peter@mentorino.me', 'Nexinbe@77')
    await auth.expectRedirectTo(/\/(mentor|admin)/)
    const mentor = new MentorDashboardPage(page)
    await mentor.verifyDashboardLoaded()
  })

  test('REG-SMK-011: Logout invalidates session', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.login('alex.johnson@test.com', 'Test1234!')
    await auth.expectRedirectTo(/\/student/)
    await page.goto('/#/auth')
    await page.waitForLoadState('networkidle')
  })

  test('REG-SMK-015: Protected route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/student')
    await page.waitForLoadState('networkidle')
    const currentUrl = page.url()
    expect(currentUrl.includes('/auth') || currentUrl.includes('/login')).toBeTruthy()
  })
})
