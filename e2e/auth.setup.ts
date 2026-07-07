import { test as setup, expect } from '@playwright/test'

const QA_ACCOUNTS = {
  mentor: {
    email: 'peter@mentorino.me',
    password: 'Nexinbe@77',
  },
  student1: {
    email: 'alex.johnson@test.com',
    password: 'Test1234!',
  },
}

setup('authenticate as mentor', async ({ page }) => {
  expect(QA_ACCOUNTS.mentor.password).toBeTruthy()
  await page.goto('/#/auth')
  await page.fill('[placeholder="name@example.com"]', QA_ACCOUNTS.mentor.email)
  await page.fill('[placeholder="••••••••"]', QA_ACCOUNTS.mentor.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(mentor|admin)/)
  await page.context().storageState({ path: 'playwright/.auth/mentor.json' })
})

setup('authenticate as student1', async ({ page }) => {
  expect(QA_ACCOUNTS.student1.password).toBeTruthy()
  await page.goto('/#/auth')
  await page.fill('[placeholder="name@example.com"]', QA_ACCOUNTS.student1.email)
  await page.fill('[placeholder="••••••••"]', QA_ACCOUNTS.student1.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/student/)
  await page.context().storageState({ path: 'playwright/.auth/student1.json' })
})


