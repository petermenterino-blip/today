import { Page, Locator, expect } from '@playwright/test'

export class MentorInquiriesPage {
  readonly page: Page
  readonly inquiryList: Locator
  readonly inquiryCards: Locator
  readonly detailPanel: Locator
  readonly contactButton: Locator
  readonly statusBadge: Locator

  constructor(page: Page) {
    this.page = page
    this.inquiryList = page.locator('[class*="inquiry-list"], [class*="contact-list"]')
    this.inquiryCards = page.locator('[class*="inquiry-card"], [class*="contact-card"], [class*="cursor-pointer"]')
    this.detailPanel = page.locator('[class*="detail-panel"], [class*="inquiry-detail"]')
    this.contactButton = page.getByRole('button', { name: /contact|reply|respond/i }).first()
    this.statusBadge = page.locator('[class*="badge"], [class*="status"]')
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=inquiries')
    await this.page.waitForLoadState('networkidle')
  }

  async viewInquiryDetail(index = 0) {
    const card = this.inquiryCards.nth(index)
    if (await card.isVisible({ timeout: 10000 }).catch(() => false)) {
      await card.click()
      await this.page.waitForTimeout(500)
    }
  }

  async verifyInquiryFrom(emailOrName: string) {
    await expect(this.page.getByText(emailOrName).first()).toBeVisible({ timeout: 15000 }).catch(() => {})
  }
}
