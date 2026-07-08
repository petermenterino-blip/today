import { Page, Locator, expect } from '@playwright/test'

export class PublicHomePage {
  readonly page: Page
  readonly hero: Locator
  readonly headline: Locator
  readonly startApplicationCta: Locator
  readonly exploreSessionsCta: Locator
  readonly navLinks: Locator
  readonly hamburgerButton: Locator
  readonly mobileMenu: Locator
  readonly footerLinks: Locator
  readonly logo: Locator

  constructor(page: Page) {
    this.page = page
    this.hero = page.locator('main').first()
    this.headline = page.getByRole('heading', { name: /confused about direction/i })
    this.startApplicationCta = page.getByRole('link', { name: /start application/i })
    this.exploreSessionsCta = page.getByRole('link', { name: /explore sessions/i })
    this.navLinks = page.locator('nav a, header a')
    this.hamburgerButton = page.locator('button[aria-label*="menu" i], button:has(.hamburger), .hamburger-button')
    this.mobileMenu = page.locator('[class*="mobile-menu"], [class*="nav-overlay"], [class*="menu-open"]')
    this.footerLinks = page.locator('footer a')
    this.logo = page.locator('a:has-text("Mentorino"), a[href="#/"]').first()
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async verifyHeroSection() {
    await expect(this.hero).toBeVisible({ timeout: 15000 })
    await expect(this.headline).toBeVisible()
    await expect(this.startApplicationCta.or(this.exploreSessionsCta).first()).toBeVisible()
  }

  async verifyNavItems(expectedItems: string[]) {
    const navTexts = await this.navLinks.allInnerTexts()
    for (const item of expectedItems) {
      expect(navTexts.some(t => t.toLowerCase().includes(item.toLowerCase()))).toBeTruthy()
    }
  }

  async clickNavItem(label: string) {
    const link = this.page.getByRole('link', { name: new RegExp(label, 'i') }).first()
    await link.click()
    await this.page.waitForLoadState('networkidle')
  }

  async verifyNavigationTo(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path.replace('/', '\\/')))
  }

  async toggleMobileMenu() {
    await this.page.setViewportSize({ width: 375, height: 812 })
    await this.hamburgerButton.click()
    await this.page.waitForTimeout(500)
  }

  async clickLogo() {
    await this.logo.click()
    await this.page.waitForLoadState('networkidle')
  }

  async verifyNoConsoleErrors() {
    const logs: string[] = []
    this.page.on('console', msg => { if (msg.type() === 'error') logs.push(msg.text()) })
    await this.page.waitForTimeout(1000)
    expect(logs.length).toBe(0)
  }

  async checkSEO() {
    const title = await this.page.title()
    expect(title.length).toBeGreaterThan(0)
    const metaDesc = await this.page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDesc?.length).toBeGreaterThan(0)
  }

  async checkResponsive(breakpoints: number[]) {
    for (const width of breakpoints) {
      await this.page.setViewportSize({ width, height: 900 })
      await this.page.waitForTimeout(300)
      const scrollWidth = await this.page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await this.page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth <= clientWidth || scrollWidth - clientWidth < 5).toBeTruthy()
    }
  }
}
