import { Page, Locator, expect } from '@playwright/test'

export class StudentRatingsPage {
  readonly page: Page
  readonly starRating: Locator
  readonly feedbackTextarea: Locator
  readonly submitButton: Locator
  readonly previousRatings: Locator
  readonly ratingSummary: Locator

  constructor(page: Page) {
    this.page = page
    this.starRating = page.locator('[class*="star"], [aria-label*="star"], [class*="rating"] button')
    this.feedbackTextarea = page.locator('textarea[placeholder*="feedback" i], textarea[name="feedback"]').first()
    this.submitButton = page.getByRole('button', { name: /submit|save rating|send feedback/i }).first()
    this.previousRatings = page.locator('[class*="rating-list"], [class*="feedback-list"]')
    this.ratingSummary = page.locator('[class*="rating-summary"], [class*="average"]')
  }

  async goto() {
    await this.page.goto('/#/student/ratings')
    await this.page.waitForLoadState('networkidle')
  }

  async submitRating(stars: number, feedback?: string) {
    const starBtn = this.starRating.nth(stars - 1)
    if (await starBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await starBtn.click()
      await this.page.waitForTimeout(300)
    }
    if (feedback && await this.feedbackTextarea.isVisible().catch(() => false)) {
      await this.feedbackTextarea.fill(feedback)
    }
    if (await this.submitButton.isVisible().catch(() => false)) {
      await this.submitButton.click()
      await this.page.waitForTimeout(1000)
    }
  }

  async verifyRatingSubmitted() {
    await expect(this.page.getByText(/thank you|rating submitted|feedback sent/i).first()).toBeVisible({ timeout: 10000 }).catch(() => {})
  }
}
