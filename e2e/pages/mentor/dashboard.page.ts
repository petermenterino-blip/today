import { Page, Locator, expect } from '@playwright/test'

export class MentorDashboardPage {
  readonly page: Page
  readonly applicationsWidget: Locator
  readonly studentsWidget: Locator
  readonly sessionsWidget: Locator
  readonly analyticsWidget: Locator

  constructor(page: Page) {
    this.page = page
    this.applicationsWidget = page.locator('[class*="application"], section:has-text("Application")')
    this.studentsWidget = page.locator('[class*="student"], section:has-text("Student")')
    this.sessionsWidget = page.locator('[class*="session"], section:has-text("Session")')
    this.analyticsWidget = page.locator('[class*="analytic"], section:has-text("Analytic")')
  }

  async goto() {
    await this.page.goto('/#/mentor')
    await this.page.waitForLoadState('networkidle')
  }

  async verifyDashboardLoaded() {
    await expect(this.page.getByText(/overview|main menu/i).first().or(this.page.locator('h1:has-text("Overview")'))).toBeVisible({ timeout: 15000 })
  }

  async navigateTo(tab: string) {
    const tabMap: Record<string, string> = { students: 'mentees' }
    const actualTab = tabMap[tab] || tab
    await this.page.goto(`/#/mentor?tab=${actualTab}`)
    await this.page.waitForLoadState('networkidle')
  }

  async approveApplication(applicantName: string) {
    const cards = this.page.locator('[class*="cursor-pointer"]:has-text("' + applicantName + '")')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const approveBtn = card.locator('button:has-text("Approve")')
      if (await approveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await approveBtn.click()
        await this.page.waitForTimeout(1000)
        const confirmBtn = this.page.locator('button:has-text("Confirm"), dialog button:has-text("Yes")')
        if (await confirmBtn.isVisible()) await confirmBtn.click()
        return
      }
    }
  }

  async rejectApplication(applicantName: string, reason?: string) {
    const cards = this.page.locator('[class*="cursor-pointer"]:has-text("' + applicantName + '")')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const rejectBtn = card.locator('button:has-text("Reject")')
      if (await rejectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await rejectBtn.click()
        if (reason) {
          const textarea = this.page.locator('textarea[name="reason"], textarea[placeholder*="reason" i]')
          if (await textarea.isVisible()) await textarea.fill(reason)
        }
        await this.page.locator('button:has-text("Confirm"), button:has-text("Submit")').click()
        return
      }
    }
  }

  async assignGoalToStudent(studentName: string, goalTitle: string) {
    await this.navigateTo('students')
    await this.page.waitForTimeout(2000)
    const studentText = this.page.getByText(studentName)
    if (await studentText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studentText.first().click()
      await this.page.waitForTimeout(1000)
    }
    const addGoalBtn = this.page.getByRole('button', { name: /add goal|create goal|assign goal/i }).first()
    if (await addGoalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addGoalBtn.click()
    }
  }
}

export class MentorApplicationsPage {
  readonly page: Page

  constructor(page: Page) { this.page = page }

  async goto() {
    await this.page.goto('/#/mentor?tab=applications')
    await this.page.waitForLoadState('networkidle')
  }

  async verifyApplicationsVisible() {
    await expect(this.page.getByRole('heading', { name: /applications/i })).toBeVisible({ timeout: 15000 })
  }

  async viewApplicationDetail(applicantName: string) {
    const appName = this.page.getByText(applicantName).first()
    if (await appName.isVisible()) await appName.click()
  }
}

export class MentorSessionsPage {
  readonly page: Page

  constructor(page: Page) { this.page = page }

  async scheduleSession(studentName: string) {
    await this.page.getByRole('button', { name: /schedule|new session/i }).first().click()
    await this.page.waitForTimeout(500)
    await this.page.locator('input[placeholder*="student" i], select[name="student"]').fill(studentName)
    await this.page.locator('button:has-text("Confirm"), button:has-text("Schedule")').click()
    await this.page.waitForTimeout(500)
  }
}
