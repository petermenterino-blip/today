import { test as setup } from '@playwright/test'

const QA_ACCOUNTS = {
  mentor: {
    email: process.env.STAGING_MENTOR_EMAIL || 'mentor.qa@mentorino.test',
    password: process.env.STAGING_MENTOR_PASSWORD || process.env.STAGING_PASSWORD || '',
  },
  student1: {
    email: process.env.STAGING_STUDENT1_EMAIL || 'student1.qa@mentorino.test',
    password: process.env.STAGING_STUDENT1_PASSWORD || process.env.STAGING_PASSWORD || '',
  },
  student2: {
    email: process.env.STAGING_STUDENT2_EMAIL || 'student2.qa@mentorino.test',
    password: process.env.STAGING_STUDENT2_PASSWORD || process.env.STAGING_PASSWORD || '',
  },
}

setup('authenticate as mentor', async ({ page }) => {
  await page.goto('/#/auth')
  await page.fill('[placeholder="name@example.com"]', QA_ACCOUNTS.mentor.email)
  await page.fill('[placeholder="••••••••"]', QA_ACCOUNTS.mentor.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(mentor|admin)/)
  await page.context().storageState({ path: 'playwright/.auth/mentor.json' })
})

setup('authenticate as student1', async ({ page }) => {
  await page.goto('/#/auth')
  await page.fill('[placeholder="name@example.com"]', QA_ACCOUNTS.student1.email)
  await page.fill('[placeholder="••••••••"]', QA_ACCOUNTS.student1.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/student/)
  await page.context().storageState({ path: 'playwright/.auth/student1.json' })
})

setup('authenticate as student2', async ({ page }) => {
  await page.goto('/#/auth')
  await page.fill('[placeholder="name@example.com"]', QA_ACCOUNTS.student2.email)
  await page.fill('[placeholder="••••••••"]', QA_ACCOUNTS.student2.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/student/)
  await page.context().storageState({ path: 'playwright/.auth/student2.json' })
})
