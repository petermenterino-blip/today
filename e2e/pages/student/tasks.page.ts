import { Page, Locator, expect } from '@playwright/test'

export class StudentTasksPage {
  readonly page: Page
  readonly createTaskButton: Locator
  readonly titleInput: Locator
  readonly saveButton: Locator
  readonly taskList: Locator
  readonly filterDropdown: Locator
  readonly reorderHandle: Locator

  constructor(page: Page) {
    this.page = page
    this.createTaskButton = page.getByRole('button', { name: /new task|add task|create task/i }).first()
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
    this.saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first()
    this.taskList = page.locator('[class*="task-list"], [class*="tasks"] li, [class*="task-item"]')
    this.filterDropdown = page.locator('select[name="filter"], [class*="filter"]').first()
    this.reorderHandle = page.locator('[class*="drag"], [class*="handle"], [class*="reorder"]')
  }

  async goto() {
    await this.page.goto('/#/student/tasks')
    await this.page.waitForLoadState('networkidle')
  }

  async createTask(title: string) {
    if (await this.createTaskButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.createTaskButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.titleInput.fill(title)
    await this.saveButton.click()
    await this.page.waitForTimeout(1000)
  }

  async verifyTaskVisible(title: string) {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10000 })
  }

  async completeTask(title: string) {
    const task = this.page.locator(`[class*="task"]:has-text("${title}")`)
    const checkbox = task.locator('input[type="checkbox"], [class*="checkbox"]')
    if (await checkbox.first().isVisible().catch(() => false)) {
      await checkbox.first().click()
      await this.page.waitForTimeout(500)
    }
  }
}
