import { test, expect, BrowserContext, Page } from '@playwright/test'

async function createContext(browser: any, storageState: string): Promise<{ context: BrowserContext, page: Page }> {
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()
  return { context, page }
}

test.describe.skip('Realtime Synchronization — Multi-Browser', () => {

  test('mentor sends message, student1 receives it', async ({ browser }) => {
    const mentor = await createContext(browser, 'playwright/.auth/mentor.json')
    const student1 = await createContext(browser, 'playwright/.auth/student1.json')

    try {
      await mentor.page.goto('/#/mentor?tab=messaging')
      await mentor.page.waitForTimeout(3000)

      const messageInput = mentor.page.getByPlaceholder('Type a message')
      const sendBtn = mentor.page.getByLabel('Send message')

      if (await messageInput.isVisible()) {
        const testMessage = `Realtime test message ${Date.now()}`
        await messageInput.fill(testMessage)
        if (await sendBtn.isVisible()) {
          await sendBtn.click()
        } else {
          await messageInput.press('Enter')
        }
        await mentor.page.waitForTimeout(2000)

        await student1.page.goto('/#/student/messages')
        await student1.page.waitForTimeout(4000)
        await expect(student1.page.getByText(testMessage).first()).toBeVisible({ timeout: 10000 })
      }
    } finally {
      await mentor.context.close()
      await student1.context.close()
    }
  })

  test('student1 replies, mentor receives it', async ({ browser }) => {
    const mentor = await createContext(browser, 'playwright/.auth/mentor.json')
    const student1 = await createContext(browser, 'playwright/.auth/student1.json')

    try {
      await student1.page.goto('/#/student/messages')
      await student1.page.waitForTimeout(3000)

      const messageInput = student1.page.getByPlaceholder('Type a message')
      const replyMessage = `Realtime reply ${Date.now()}`

      await expect(messageInput).toBeVisible({ timeout: 10000 })
      await messageInput.fill(replyMessage)

      const sendBtn = student1.page.getByLabel('Send message')
      const btnVisible = await sendBtn.isVisible().catch(() => false)
      if (btnVisible) {
        await sendBtn.click()
      } else {
        await messageInput.press('Enter')
      }
      await student1.page.waitForTimeout(2000)

      await mentor.page.goto('/#/mentor?tab=messaging')
      await mentor.page.waitForTimeout(5000)
      await expect(mentor.page.getByText(replyMessage).first()).toBeVisible({ timeout: 15000 })
    } finally {
      await mentor.context.close()
      await student1.context.close()
    }
  })

  test('reconnect after page refresh', async ({ browser }) => {
    const mentor = await createContext(browser, 'playwright/.auth/mentor.json')

    try {
      await mentor.page.goto('/#/mentor?tab=messaging')
      await mentor.page.waitForTimeout(2000)

      await mentor.page.reload()
      await mentor.page.waitForTimeout(3000)
      await expect(mentor.page.getByPlaceholder('Type a message')).toBeVisible({ timeout: 5000 })
    } finally {
      await mentor.context.close()
    }
  })

  test('navigation between tabs does not cause page errors', async ({ browser }) => {
    const mentor = await createContext(browser, 'playwright/.auth/mentor.json')

    try {
      const errors: string[] = []
      mentor.page.on('pageerror', (err) => errors.push(err.message))

      await mentor.page.goto('/#/mentor')
      await mentor.page.waitForTimeout(2000)

      await mentor.page.goto('/#/mentor?tab=messaging')
      await mentor.page.waitForTimeout(2000)

      await mentor.page.goto('/#/mentor?tab=analytics')
      await mentor.page.waitForTimeout(2000)

      await mentor.page.goto('/#/mentor')
      await mentor.page.waitForTimeout(2000)

      expect(errors).toHaveLength(0)
    } finally {
      await mentor.context.close()
    }
  })
})
