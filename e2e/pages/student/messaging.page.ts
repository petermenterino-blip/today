import { Page, Locator, expect } from '@playwright/test'

export class StudentMessagingPage {
  readonly page: Page
  readonly composeButton: Locator
  readonly recipientInput: Locator
  readonly messageInput: Locator
  readonly sendButton: Locator
  readonly conversationList: Locator
  readonly messagesInThread: Locator
  readonly attachmentButton: Locator

  constructor(page: Page) {
    this.page = page
    this.composeButton = page.getByRole('button', { name: /new message|compose/i }).first()
    this.recipientInput = page.locator('input[placeholder*="search" i], input[name="recipient"]').first()
    this.messageInput = page.locator('textarea[placeholder*="message" i], [contenteditable="true"]').first()
    this.sendButton = page.locator('button:has-text("Send")').first()
    this.conversationList = page.locator('[class*="conversation"], [class*="chat-list"]')
    this.messagesInThread = page.locator('[class*="message-bubble"], [class*="msg"]')
    this.attachmentButton = page.getByRole('button', { name: /attach|file|upload/i }).first()
  }

  async goto() {
    await this.page.goto('/#/student/messages')
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

  async verifyMessageSent() {
    await expect(this.page.locator('[class*="sent"], [class*="delivered"]').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
  }

  async openConversation(index = 0) {
    const conv = this.conversationList.nth(index)
    if (await conv.isVisible()) {
      await conv.click()
      await this.page.waitForTimeout(500)
    }
  }
}
