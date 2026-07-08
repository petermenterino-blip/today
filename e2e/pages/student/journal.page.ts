import { Page, Locator, expect } from '@playwright/test'

export class StudentJournalPage {
  readonly page: Page
  readonly newEntryButton: Locator
  readonly contentTextarea: Locator
  readonly saveButton: Locator
  readonly entryList: Locator
  readonly moodSelector: Locator

  constructor(page: Page) {
    this.page = page
    this.newEntryButton = page.getByRole('button', { name: /new entry|create entry|add entry/i }).first()
    this.contentTextarea = page.locator('textarea[placeholder*="write" i], textarea[name="content"]').first()
    this.saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Post"), button:has-text("Submit")').first()
    this.entryList = page.locator('[class*="journal-list"], [class*="entry-list"], [class*="entries"]')
    this.moodSelector = page.locator('[class*="mood"], [class*="emotion"], [aria-label*="mood"]')
  }

  async goto() {
    await this.page.goto('/#/student/journal')
    await this.page.waitForLoadState('networkidle')
  }

  async createEntry(content: string) {
    if (await this.newEntryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.newEntryButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.contentTextarea.fill(content)
    if (await this.moodSelector.isVisible().catch(() => false)) {
      await this.moodSelector.first().click()
    }
    await this.saveButton.click()
    await this.page.waitForTimeout(1000)
  }

  async verifyEntryVisible(contentPreview: string) {
    await expect(this.page.getByText(contentPreview).first()).toBeVisible({ timeout: 10000 })
  }
}
