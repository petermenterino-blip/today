import { Page, Locator, expect } from '@playwright/test'

export class ApplyPage {
  readonly page: Page
  readonly programCards: Locator
  readonly applyButton: Locator
  readonly applicationForm: Locator
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly messageTextarea: Locator
  readonly submitButton: Locator
  readonly confirmationMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.programCards = page.getByRole('link', { name: /start application/i })
    this.applyButton = page.getByRole('link', { name: /start application|apply for programs/i })
    this.applicationForm = page.locator('form')
    this.nameInput = page.locator('input[placeholder*="John Doe" i]')
    this.emailInput = page.locator('input[placeholder*="john@example" i]')
    this.messageTextarea = page.locator('textarea[placeholder*="Tell Peter" i]')
    this.submitButton = page.locator('button:has-text("Send Message")')
    this.confirmationMessage = page.getByRole('heading', { name: /message sent/i })
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async selectProgram(index = 0) {
    const card = this.programCards.nth(index)
    await card.click()
    await this.page.waitForLoadState('networkidle')
  }

  async clickApply() {
    await this.applyButton.first().click()
    await this.page.waitForLoadState('networkidle')
  }

  async fillApplication(data: { name: string; email: string; message: string }) {
    await this.nameInput.fill(data.name)
    await this.emailInput.fill(data.email)
    await this.messageTextarea.fill(data.message)
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(3000)
  }

  async expectSuccess() {
    await expect(this.confirmationMessage).toBeVisible({ timeout: 10000 })
  }
}
