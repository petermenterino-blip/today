import { Page, Locator, expect } from '@playwright/test'

export class MentorMessagingPage {
  readonly page: Page
  readonly composeButton: Locator
  readonly recipientInput: Locator
  readonly messageInput: Locator
  readonly sendButton: Locator
  readonly conversationList: Locator
  readonly searchInput: Locator
  readonly attachmentButton: Locator

  constructor(page: Page) {
    this.page = page
    this.composeButton = page.getByRole('button', { name: /new message|compose/i }).first()
    this.recipientInput = page.locator('input[placeholder*="search" i], input[name="recipient"]').first()
    this.messageInput = page.locator('textarea[placeholder*="message" i], [contenteditable="true"]').first()
    this.sendButton = page.locator('button:has-text("Send")').first()
    this.conversationList = page.locator('[class*="conversation"], [class*="chat-list"]')
    this.searchInput = page.locator('input[placeholder*="search" i]').first()
    this.attachmentButton = page.getByRole('button', { name: /attach|file|upload/i }).first()
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=messages')
    await this.page.waitForLoadState('networkidle')
  }

  async sendMessage(recipient: string, message: string) {
    if (await this.composeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.composeButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.recipientInput.fill(recipient)
    await this.messageInput.fill(message)
    await this.sendButton.click()
    await this.page.waitForTimeout(1000)
  }

  async searchConversations(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500)
  }
}
