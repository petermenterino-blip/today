import { Page, Locator, expect } from '@playwright/test'

export class MentorSessionsPage {
  readonly page: Page
  readonly scheduleButton: Locator
  readonly calendarView: Locator
  readonly sessionList: Locator
  readonly studentSelect: Locator
  readonly datePicker: Locator
  readonly timeSlotSelector: Locator
  readonly confirmButton: Locator
  readonly rescheduleButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    this.page = page
    this.scheduleButton = page.getByRole('button', { name: /schedule|new session|create session/i }).first()
    this.calendarView = page.locator('[class*="calendar"], [class*="schedule"]')
    this.sessionList = page.locator('[class*="session-list"], [class*="appointment-list"]')
    this.studentSelect = page.locator('input[placeholder*="student" i], select[name="student"]').first()
    this.datePicker = page.locator('[class*="datepicker"], input[type="date"]').first()
    this.timeSlotSelector = page.locator('[class*="time-slot"], [class*="available"]')
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Schedule"), button:has-text("Create")')
    this.rescheduleButton = page.getByRole('button', { name: /reschedule/i }).first()
    this.cancelButton = page.getByRole('button', { name: /cancel session|cancel booking/i }).first()
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=sessions')
    await this.page.waitForLoadState('networkidle')
  }

  async scheduleSession(studentName: string) {
    if (await this.scheduleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.scheduleButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.studentSelect.fill(studentName)
    const slot = this.timeSlotSelector.first()
    if (await slot.isVisible().catch(() => false)) {
      await slot.click()
    }
    if (await this.confirmButton.isVisible().catch(() => false)) {
      await this.confirmButton.click()
      await this.page.waitForTimeout(500)
    }
  }

  async verifySessionsVisible() {
    await expect(this.calendarView.or(this.sessionList).first()).toBeVisible({ timeout: 10000 })
  }
}
