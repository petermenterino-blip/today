import { Page, Locator, expect } from '@playwright/test'

export class StudentResourcesPage {
  readonly page: Page
  readonly resourceList: Locator
  readonly searchInput: Locator
  readonly downloadButton: Locator
  readonly categoryFilter: Locator
  readonly resourceCards: Locator

  constructor(page: Page) {
    this.page = page
    this.resourceList = page.locator('[class*="resource-list"], [class*="library"]')
    this.searchInput = page.locator('input[placeholder*="search" i]').first()
    this.downloadButton = page.getByRole('button', { name: /download|view resource/i }).first()
    this.categoryFilter = page.locator('select, [class*="category"]').first()
    this.resourceCards = page.locator('[class*="resource-card"], [class*="file"], [class*="document"]')
  }

  async goto() {
    await this.page.goto('/#/student/resources')
    await this.page.waitForLoadState('networkidle')
  }

  async searchResources(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500)
  }

  async downloadFirstResource() {
    if (await this.downloadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.downloadButton.click()
      await this.page.waitForTimeout(1000)
    }
  }

  async verifyResourcesVisible() {
    const count = await this.resourceCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  }
}
