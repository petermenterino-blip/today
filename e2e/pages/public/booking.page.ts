import { Page, Locator, expect } from '@playwright/test'

export class BookingPage {
  readonly page: Page
  readonly calendarPicker: Locator
  readonly timeSlots: Locator
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly notesTextarea: Locator
  readonly confirmButton: Locator
  readonly cancellationMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.calendarPicker = page.locator('[class*="calendar"], [class*="datepicker"]')
    this.timeSlots = page.locator('[class*="time-slot"], [class*="available-slot"]')
    this.nameInput = page.locator('input[placeholder*="John Doe" i], input[name="name"]').first()
    this.emailInput = page.locator('input[placeholder*="john@example" i], input[name="email"]').first()
    this.phoneInput = page.locator('input[placeholder*="phone" i], input[name="phone"]').first()
    this.notesTextarea = page.locator('textarea[placeholder*="note" i], textarea[name="notes"]')
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Book"), button:has-text("Schedule")')
    this.cancellationMessage = page.locator('[class*="confirmed"], [class*="success"], h2:has-text("Booked")')
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
    const bookCta = this.page.getByRole('link', { name: /book a consultation|book session/i }).first()
    if (await bookCta.isVisible()) {
      await bookCta.click()
      await this.page.waitForLoadState('networkidle')
    }
  }

  async selectDate(dateString?: string) {
    if (await this.calendarPicker.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (dateString) {
        const dateCell = this.page.locator(`[class*="day"]:has-text("${dateString}")`).first()
        if (await dateCell.isVisible()) await dateCell.click()
      } else {
        const availableDate = this.calendarPicker.locator('button:not([disabled])').first()
        if (await availableDate.isVisible()) await availableDate.click()
      }
      await this.page.waitForTimeout(500)
    }
  }

  async selectTimeSlot(index = 0) {
    const slot = this.timeSlots.nth(index)
    if (await slot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await slot.click()
      await this.page.waitForTimeout(300)
    }
  }

  async fillBookingForm(data: { name: string; email: string; phone?: string; notes?: string }) {
    await this.nameInput.fill(data.name)
    await this.emailInput.fill(data.email)
    if (data.phone) await this.phoneInput.fill(data.phone)
    if (data.notes && await this.notesTextarea.isVisible().catch(() => false)) {
      await this.notesTextarea.fill(data.notes)
    }
  }

  async confirmBooking() {
    await this.confirmButton.click()
    await this.page.waitForTimeout(2000)
  }

  async expectBookingConfirmed() {
    await expect(this.cancellationMessage).toBeVisible({ timeout: 10000 })
  }
}
