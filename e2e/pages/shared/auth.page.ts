import { Page, Locator, expect } from '@playwright/test'

export class AuthPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[placeholder="name@example.com"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.submitButton = page.locator('button:has-text("SIGN IN")')
    this.errorMessage = page.locator('[class*="error"], [role="alert"]')
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot|reset password/i })
  }

  async goto() {
    await this.page.goto('/#/auth', { waitUntil: 'networkidle' })
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectRedirectTo(pathPattern: RegExp) {
    await this.page.waitForURL(pathPattern, { timeout: 15000 })
  }

  async expectErrorMessage() {
    await expect(this.errorMessage.first()).toBeVisible({ timeout: 10000 })
  }

  async expectLoginSuccess() {
    await this.page.waitForResponse(resp =>
      resp.url().includes('/auth') && resp.status() === 200,
      { timeout: 15000 }
    )
  }
}
