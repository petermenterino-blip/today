import { Page, Locator, expect } from '@playwright/test'

export class StudentProgramsPage {
  readonly page: Page
  readonly programList: Locator
  readonly searchInput: Locator
  readonly applyButton: Locator
  readonly filterOptions: Locator

  constructor(page: Page) {
    this.page = page
    this.programList = page.locator('[class*="program"], [class*="course"]')
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first()
    this.applyButton = page.getByRole('button', { name: /apply|enroll|register/i }).first()
    this.filterOptions = page.locator('select, [class*="filter"]')
  }

  async goto() {
    await this.page.goto('/#/student/programs')
    await this.page.waitForLoadState('networkidle')
  }

  async searchPrograms(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500)
  }

  async applyToProgram(index = 0) {
    const btn = this.applyButton.nth(index)
    if (await btn.isVisible()) {
      await btn.click()
      await this.page.waitForTimeout(1000)
    }
  }

  async verifyProgramsVisible() {
    await expect(this.programList.first()).toBeVisible({ timeout: 10000 })
  }
}
