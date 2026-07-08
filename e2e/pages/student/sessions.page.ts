import { Page, Locator, expect } from '@playwright/test'

export class StudentSessionsPage {
  readonly page: Page
  readonly bookSessionButton: Locator
  readonly calendarPicker: Locator
  readonly timeSlots: Locator
  readonly confirmButton: Locator
  readonly upcomingSessions: Locator
  readonly rescheduleButton: Locator
  readonly cancelButton: Locator
  readonly joinButton: Locator
  readonly notesTextarea: Locator

  constructor(page: Page) {
    this.page = page
    this.bookSessionButton = page.getByRole('button', { name: /book session|schedule session|new session/i }).first()
    this.calendarPicker = page.locator('[class*="calendar"], [class*="datepicker"]')
    this.timeSlots = page.locator('[class*="time-slot"], [class*="available-slot"]')
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Book"), button:has-text("Schedule")')
    this.upcomingSessions = page.locator('[class*="upcoming"], [class*="session-list"]')
    this.rescheduleButton = page.getByRole('button', { name: /reschedule|change time/i }).first()
    this.cancelButton = page.getByRole('button', { name: /cancel session|cancel booking/i }).first()
    this.joinButton = page.getByRole('button', { name: /join session|join meeting/i }).first()
    this.notesTextarea = page.locator('textarea[placeholder*="note" i], textarea[name="notes"]').first()
  }

  async goto() {
    await this.page.goto('/#/student/sessions')
    await this.page.waitForLoadState('networkidle')
  }

  async bookSession() {
    if (await this.bookSessionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.bookSessionButton.click()
      await this.page.waitForTimeout(1000)
    }
    const slot = this.timeSlots.first()
    if (await slot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await slot.click()
      await this.page.waitForTimeout(300)
    }
    if (await this.confirmButton.isVisible().catch(() => false)) {
      await this.confirmButton.click()
      await this.page.waitForTimeout(1000)
    }
  }

  async verifySessionBooked() {
    await expect(this.page.getByText(/confirmed|booked|upcoming session/i).first()).toBeVisible({ timeout: 10000 })
  }

  async cancelNextSession() {
    if (await this.cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.cancelButton.click()
      await this.page.waitForTimeout(500)
      const confirmCancel = this.page.locator('button:has-text("Yes"), button:has-text("Confirm")').first()
      if (await confirmCancel.isVisible()) await confirmCancel.click()
      await this.page.waitForTimeout(500)
    }
  }
}
