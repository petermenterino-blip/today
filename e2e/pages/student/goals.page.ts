import { Page, Locator, expect } from '@playwright/test'

export class StudentGoalsPage {
  readonly page: Page
  readonly createGoalButton: Locator
  readonly titleInput: Locator
  readonly descriptionInput: Locator
  readonly saveButton: Locator
  readonly goalList: Locator
  readonly progressBar: Locator

  constructor(page: Page) {
    this.page = page
    this.createGoalButton = page.getByRole('button', { name: /new goal|add goal|create goal/i }).first()
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
    this.descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="desc" i]').first()
    this.saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first()
    this.goalList = page.locator('[class*="goal-list"], [class*="goals"] li, [class*="goal-item"]')
    this.progressBar = page.locator('[class*="progress"], [class*="bar"]')
  }

  async goto() {
    await this.page.goto('/#/student/goals')
    await this.page.waitForLoadState('networkidle')
  }

  async createGoal(title: string, description?: string) {
    if (await this.createGoalButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.createGoalButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.titleInput.fill(title)
    if (description && await this.descriptionInput.isVisible().catch(() => false)) {
      await this.descriptionInput.fill(description)
    }
    await this.saveButton.click()
    await this.page.waitForTimeout(1000)
  }

  async verifyGoalVisible(title: string) {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10000 })
  }

  async markGoalComplete(title: string) {
    const goal = this.page.locator(`[class*="goal"]:has-text("${title}")`)
    const checkbox = goal.locator('input[type="checkbox"], [class*="checkbox"], button:has-text("Complete")')
    if (await checkbox.first().isVisible().catch(() => false)) {
      await checkbox.first().click()
      await this.page.waitForTimeout(500)
    }
  }
}
