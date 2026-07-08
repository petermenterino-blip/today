import { Page, Locator, expect } from '@playwright/test'

export class MentorApplicationsPage {
  readonly page: Page
  readonly applicationList: Locator
  readonly applicationCards: Locator
  readonly approveButton: Locator
  readonly rejectButton: Locator
  readonly detailPanel: Locator
  readonly reasonTextarea: Locator
  readonly confirmButton: Locator

  constructor(page: Page) {
    this.page = page
    this.applicationList = page.locator('[class*="application-list"], [class*="queue"]')
    this.applicationCards = page.locator('[class*="application-card"], [class*="cursor-pointer"]')
    this.approveButton = page.getByRole('button', { name: /approve|accept/i }).first()
    this.rejectButton = page.getByRole('button', { name: /reject|decline/i }).first()
    this.detailPanel = page.locator('[class*="detail-panel"], [class*="application-detail"]')
    this.reasonTextarea = page.locator('textarea[name="reason"], textarea[placeholder*="reason" i]').first()
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Submit")').first()
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=applications')
    await this.page.waitForLoadState('networkidle')
  }

  async viewApplicationDetail(applicantName: string) {
    const appText = this.page.getByText(applicantName).first()
    if (await appText.isVisible({ timeout: 10000 }).catch(() => false)) {
      await appText.click()
      await this.page.waitForTimeout(500)
    }
  }

  async verifyApplicationsVisible() {
    await expect(this.page.getByRole('heading', { name: /applications/i })).toBeVisible({ timeout: 15000 })
  }

  async approveApplication(applicantName: string) {
    const cards = this.page.locator(`[class*="cursor-pointer"]:has-text("${applicantName}")`)
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      if (await card.locator('button:has-text("Approve")').isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.locator('button:has-text("Approve")').click()
        await this.page.waitForTimeout(500)
        if (await this.confirmButton.isVisible().catch(() => false)) await this.confirmButton.click()
        return
      }
    }
  }

  async rejectApplication(applicantName: string, reason?: string) {
    const cards = this.page.locator(`[class*="cursor-pointer"]:has-text("${applicantName}")`)
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      if (await card.locator('button:has-text("Reject")').isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.locator('button:has-text("Reject")').click()
        if (reason && await this.reasonTextarea.isVisible().catch(() => false)) {
          await this.reasonTextarea.fill(reason)
        }
        if (await this.confirmButton.isVisible().catch(() => false)) await this.confirmButton.click()
        return
      }
    }
  }
}
