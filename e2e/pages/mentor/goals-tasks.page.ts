import { Page, Locator, expect } from '@playwright/test'

export class MentorGoalsTasksPage {
  readonly page: Page
  readonly studentList: Locator
  readonly addGoalButton: Locator
  readonly addTaskButton: Locator
  readonly titleInput: Locator
  readonly saveButton: Locator
  readonly goalList: Locator
  readonly taskList: Locator
  readonly progressIndicator: Locator

  constructor(page: Page) {
    this.page = page
    this.studentList = page.locator('[class*="student-list"], [class*="mentee-list"]')
    this.addGoalButton = page.getByRole('button', { name: /add goal|create goal|assign goal/i }).first()
    this.addTaskButton = page.getByRole('button', { name: /add task|create task|assign task/i }).first()
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
    this.saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first()
    this.goalList = page.locator('[class*="goal-list"], [class*="goals"]')
    this.taskList = page.locator('[class*="task-list"], [class*="tasks"]')
    this.progressIndicator = page.locator('[class*="progress"], [class*="status"]')
  }

  async goto() {
    await this.page.goto('/#/mentor?tab=students')
    await this.page.waitForLoadState('networkidle')
  }

  async selectStudent(studentName: string) {
    const student = this.page.getByText(studentName).first()
    if (await student.isVisible({ timeout: 10000 }).catch(() => false)) {
      await student.click()
      await this.page.waitForTimeout(500)
    }
  }

  async assignGoal(studentName: string, goalTitle: string) {
    await this.selectStudent(studentName)
    if (await this.addGoalButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.addGoalButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.titleInput.fill(goalTitle)
    await this.saveButton.click()
    await this.page.waitForTimeout(1000)
  }

  async assignTask(studentName: string, taskTitle: string) {
    await this.selectStudent(studentName)
    if (await this.addTaskButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.addTaskButton.click()
      await this.page.waitForTimeout(500)
    }
    await this.titleInput.fill(taskTitle)
    await this.saveButton.click()
    await this.page.waitForTimeout(1000)
  }
}
