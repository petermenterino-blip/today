import { expect } from '@playwright/test'
import { Page } from '@playwright/test'

export class NotificationFixture {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async getNotificationBadgeCount(): Promise<number> {
    const badge = this.page.locator('[class*="badge"], [class*="count"]').first()
    const text = await badge.textContent().catch(() => '0')
    const parsed = parseInt(text || '0', 10)
    return isNaN(parsed) ? 0 : parsed
  }

  async openNotificationPanel() {
    const bell = this.page.locator('[class*="notification"] button, [class*="bell"]').first()
    if (await bell.isVisible().catch(() => false)) {
      await bell.click()
      await this.page.waitForTimeout(500)
    }
  }

  async getNotificationList(): Promise<string[]> {
    const items = this.page.locator('[class*="notification-item"], [class*="notif-item"]')
    const count = await items.count().catch(() => 0)
    const texts: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent().catch(() => '')
      if (text) texts.push(text.trim())
    }
    return texts
  }

  async clickNotification(index = 0) {
    const items = this.page.locator('[class*="notification-item"], [class*="notif-item"]')
    if (await items.nth(index).isVisible().catch(() => false)) {
      await items.nth(index).click()
      await this.page.waitForTimeout(500)
    }
  }

  async markAllAsRead() {
    const markReadBtn = this.page.getByRole('button', { name: /mark all read|mark as read/i }).first()
    if (await markReadBtn.isVisible().catch(() => false)) {
      await markReadBtn.click()
      await this.page.waitForTimeout(500)
    }
  }

  async assertNotificationVisible(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 10000 })
  }
}
