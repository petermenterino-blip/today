import { Page, Locator, expect } from '@playwright/test'

export class ContactPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly subjectSelect: Locator
  readonly messageTextarea: Locator
  readonly submitButton: Locator
  readonly confirmationMessage: Locator
  readonly errorMessages: Locator
  readonly disciplineSelect: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('input[placeholder*="John Doe" i]')
    this.emailInput = page.locator('input[placeholder*="john@example" i]')
    this.phoneInput = page.locator('input[placeholder*="phone" i], input[name="phone"]').first()
    this.subjectSelect = page.locator('select').nth(1)
    this.disciplineSelect = page.locator('select').first()
    this.messageTextarea = page.locator('textarea[placeholder*="Tell Peter" i]')
    this.submitButton = page.locator('button:has-text("Send Message")')
    this.confirmationMessage = page.getByRole('heading', { name: /message sent/i })
    this.errorMessages = page.locator('[class*="error"]')
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async fillContactForm(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    await this.nameInput.fill(data.name)
    await this.emailInput.fill(data.email)
    if (data.phone) await this.phoneInput.fill(data.phone)
    if (data.subject) await this.subjectSelect.selectOption(data.subject)
    await this.messageTextarea.fill(data.message)
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(3000)
  }

  async expectSuccess() {
    await expect(this.confirmationMessage).toBeVisible({ timeout: 10000 })
  }

  async expectValidationError() {
    await this.page.waitForTimeout(1000)
  }
}
