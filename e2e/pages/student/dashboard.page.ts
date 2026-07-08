import { Page, Locator, expect } from '@playwright/test'

export class StudentDashboardPage {
  readonly page: Page
  readonly dashboardWidgets: Locator
  readonly goalsSection: Locator
  readonly tasksSection: Locator
  readonly sessionsSection: Locator
  readonly messagesSection: Locator
  readonly createGoalButton: Locator
  readonly goalList: Locator
  readonly createTaskButton: Locator
  readonly taskList: Locator
  readonly bookSessionButton: Locator
  readonly profileMenu: Locator

  constructor(page: Page) {
    this.page = page
    this.dashboardWidgets = page.locator('nav a:has-text("Overview"), nav a:has-text("Programs"), nav a:has-text("Goals"), nav a:has-text("Tasks")')
    this.goalsSection = page.locator('[class*="goal"]')
    this.tasksSection = page.locator('[class*="task"]')
    this.sessionsSection = page.locator('[class*="session"]')
    this.messagesSection = page.getByRole('link', { name: /messages/i })
    this.createGoalButton = page.getByRole('button', { name: /create goal|new goal|add goal/i })
    this.goalList = page.locator('[class*="goal-list"], [class*="goals"] li, [class*="goal-item"]')
    this.createTaskButton = page.getByRole('button', { name: /create task|new task|add task/i })
    this.taskList = page.locator('[class*="task-list"], [class*="tasks"] li, [class*="task-item"]')
    this.bookSessionButton = page.getByRole('button', { name: /book session|schedule session|new session/i })
    this.profileMenu = page.locator('[class*="profile"], [class*="avatar"], [class*="user-menu"]').first()
  }

  async goto() {
    await this.page.goto('/#/student')
    await this.page.waitForLoadState('networkidle')
  }

  async verifyDashboardLoaded() {
    const count = await this.dashboardWidgets.count()
    expect(count).toBeGreaterThan(0)
  }
}

export class StudentGoalsPage {
  readonly page: Page

  constructor(page: Page) { this.page = page }
  readonly goalsLink = (page: Page) => page.getByRole('link', { name: /goals/i })

  async goto() {
    await this.page.goto('/#/student/goals')
    await this.page.waitForLoadState('networkidle')
  }

  async createGoal(title: string, description?: string) {
    await this.page.goto('/#/student/goals')
    await this.page.waitForLoadState('networkidle')
    const addBtn = this.page.getByRole('button', { name: /add goal|new goal|create goal/i }).or(this.page.locator('[href*="goals/new"]')).first()
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await this.page.waitForTimeout(500)
      const titleInput = this.page.locator('input[placeholder*="title" i], input[name="title"]').first()
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(title)
        if (description) {
          const descInput = this.page.locator('textarea[placeholder*="desc" i], textarea[name="description"]').first()
          if (await descInput.isVisible().catch(() => false)) await descInput.fill(description)
        }
        await this.page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first().click().catch(() => {})
        await this.page.waitForTimeout(1000)
      }
    }
  }

  async verifyGoalVisible(title: string) {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10000 })
  }

  async markGoalComplete(title: string) {
    const goal = this.page.locator(`[class*="goal"]:has-text("${title}")`)
    const checkbox = goal.locator('input[type="checkbox"], [class*="checkbox"], button:has-text("Complete")')
    await checkbox.first().click()
    await this.page.waitForTimeout(500)
  }
}

export class StudentSessionsPage {
  readonly page: Page

  constructor(page: Page) { this.page = page }

  async bookSession() {
    await this.page.getByRole('button', { name: /book session|schedule/i }).first().click()
    await this.page.waitForTimeout(1000)
    const slot = this.page.locator('[class*="time-slot"], [class*="available-slot"]').first()
    if (await slot.isVisible()) await slot.click()
    await this.page.locator('button:has-text("Confirm"), button:has-text("Book")').click()
    await this.page.waitForTimeout(1000)
  }

  async verifySessionBooked() {
    await expect(this.page.getByText(/confirmed|booked|upcoming session/i).first()).toBeVisible({ timeout: 10000 })
  }
}

export class StudentMessagesPage {
  readonly page: Page

  constructor(page: Page) { this.page = page }

  async sendMessage(recipient: string, message: string) {
    await this.page.getByRole('button', { name: /new message|compose/i }).first().click()
    await this.page.locator('input[placeholder*="search" i], input[name="recipient"]').fill(recipient)
    await this.page.locator('textarea[placeholder*="message" i]').fill(message)
    await this.page.locator('button:has-text("Send")').click()
    await this.page.waitForTimeout(500)
  }
}
