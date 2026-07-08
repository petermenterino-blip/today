import { Page, Locator, expect } from '@playwright/test'

export class MentorAvailabilityPage {
  readonly page: Page
  readonly availabilityGrid: Locator
  readonly addSlotButton: Locator
  readonly blockTimeButton: Locator
  readonly recurringToggle: Locator
  readonly dayCheckboxes: Locator
  readonly timeInputs: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.availabilityGrid = page.locator('[class*="availability"], [class*="schedule"]')
    this.addSlotButton = page.getByRole('button', { name: /add slot|add availability|new slot/i }).first()
    this.blockTimeButton = page.getByRole('button', { name: /block time|unavailable|block slot/i }).first()
    this.recurringToggle = page.locator('[class*="toggle"], input[type="checkbox"]').first()
    this.dayCheckboxes = page.locator('[class*="day"] input[type="checkbox"], [class*="weekday"]')
    this.timeInputs = page.locator('input[type="time"]')
    this.saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Update")').first()
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=availability')
    await this.page.waitForLoadState('networkidle')
  }

  async verifyAvailabilitySettingsVisible() {
    await expect(this.availabilityGrid).toBeVisible({ timeout: 10000 })
  }

  async addTimeSlot(day: string, startTime: string, endTime: string) {
    if (await this.addSlotButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.addSlotButton.click()
      await this.page.waitForTimeout(500)
    }
    const dayLabel = this.page.locator(`label:has-text("${day}"), [class*="day"]:has-text("${day}")`).first()
    if (await dayLabel.isVisible()) await dayLabel.click()
    const timeInputs = this.timeInputs
    const count = await timeInputs.count()
    if (count >= 2) {
      await timeInputs.nth(0).fill(startTime)
      await timeInputs.nth(1).fill(endTime)
    }
    await this.saveButton.click()
    await this.page.waitForTimeout(500)
  }
}
