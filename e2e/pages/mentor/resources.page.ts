import { Page, Locator, expect } from '@playwright/test'

export class MentorResourcesPage {
  readonly page: Page
  readonly uploadButton: Locator
  readonly fileInput: Locator
  readonly resourceList: Locator
  readonly titleInput: Locator
  readonly saveButton: Locator
  readonly searchInput: Locator
  readonly categorySelect: Locator

  constructor(page: Page) {
    this.page = page
    this.uploadButton = page.getByRole('button', { name: /upload|add resource|new resource/i }).first()
    this.fileInput = page.locator('input[type="file"]').first()
    this.resourceList = page.locator('[class*="resource-list"], [class*="library"]')
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
    this.saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Upload")').first()
    this.searchInput = page.locator('input[placeholder*="search" i]').first()
    this.categorySelect = page.locator('select[name="category"]').first()
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=resources')
    await this.page.waitForLoadState('networkidle')
  }

  async uploadResource(title: string, filePath?: string) {
    if (await this.uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.uploadButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.titleInput.fill(title)
    if (filePath) {
      await this.fileInput.setInputFiles(filePath)
    }
    if (await this.saveButton.isVisible().catch(() => false)) {
      await this.saveButton.click()
      await this.page.waitForTimeout(1000)
    }
  }
}
