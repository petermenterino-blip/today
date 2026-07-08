import { Page, Locator, expect } from '@playwright/test'

export class MentorAnalyticsPage {
  readonly page: Page
  readonly charts: Locator
  readonly metrics: Locator
  readonly dateRangePicker: Locator
  readonly exportButton: Locator
  readonly studentProgressTable: Locator
  readonly sessionStats: Locator

  constructor(page: Page) {
    this.page = page
    this.charts = page.locator('[class*="chart"], [class*="graph"], [class*="analytics"]')
    this.metrics = page.locator('[class*="stat"], [class*="metric"], [class*="count"]')
    this.dateRangePicker = page.locator('[class*="date-range"], input[type="date"]').first()
    this.exportButton = page.getByRole('button', { name: /export|download report/i }).first()
    this.studentProgressTable = page.locator('[class*="table"], [class*="student-progress"]')
    this.sessionStats = page.locator('[class*="session-stat"], [class*="booking-stat"]')
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=analytics')
    await this.page.waitForLoadState('networkidle')
  }

  async verifyAnalyticsLoaded() {
    await expect(this.charts.or(this.metrics).first()).toBeVisible({ timeout: 10000 })
  }
}
