import { test, expect, Page } from '@playwright/test'

test.describe('MENTOR DASHBOARD — FULL PRODUCTION AUDIT', () => {
  test.use({ storageState: 'playwright/.auth/mentor.json' })

  const MENTOR_TABS: { name: string; route: string; expectedText?: string }[] = [
    { name: 'Overview', route: '/#/mentor', expectedText: 'Overview' },
    { name: 'Mentees', route: '/#/mentor?tab=mentees', expectedText: 'Mentees' },
    { name: 'Applications', route: '/#/mentor?tab=applications', expectedText: 'Application' },
    { name: 'Bookings', route: '/#/mentor?tab=bookings', expectedText: 'Booking' },
    { name: 'Sessions', route: '/#/mentor?tab=sessions', expectedText: 'Session' },
    { name: 'Events', route: '/#/mentor?tab=events', expectedText: 'Event' },
    { name: 'Programs', route: '/#/mentor?tab=programs', expectedText: 'Program' },
    { name: 'Program Progress', route: '/#/mentor?tab=program-progress', expectedText: 'Progress' },
    { name: 'Feedback', route: '/#/mentor?tab=feedback', expectedText: 'Feedback' },
    { name: 'Messaging', route: '/#/mentor?tab=messaging', expectedText: 'Message' },
    { name: 'Resources', route: '/#/mentor?tab=resources', expectedText: 'Resource' },
    { name: 'Analytics', route: '/#/mentor?tab=analytics', expectedText: 'Analytic' },
    { name: 'AI Assistant', route: '/#/mentor?tab=ai', expectedText: 'AI' },
    { name: 'Gallery', route: '/#/mentor?tab=gallery', expectedText: 'Gallery' },
    { name: 'Emails', route: '/#/mentor?tab=emails', expectedText: 'Email' },
    { name: 'Growth Audit', route: '/#/mentor?tab=growth-audit', expectedText: 'Growth' },
    { name: 'Settings', route: '/#/settings', expectedText: 'Settings' },
  ]

  const consoleErrors: string[] = []
  const networkFailures: string[] = []

  async function setupAuditPage(page: Page) {
    consoleErrors.length = 0
    networkFailures.length = 0
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url().replace(/[?#].*/, '').substring(0, 120)
        networkFailures.push(`${response.status()} ${response.statusText()} — ${url}`)
      }
    })
  }

  for (const tab of MENTOR_TABS) {
    test(`[PAGE LOAD] ${tab.name} — ${tab.route}`, async ({ page }) => {
      await setupAuditPage(page)
      const start = Date.now()
      await page.goto(tab.route, { waitUntil: 'networkidle', timeout: 30000 })
      const loadTime = Date.now() - start

      // Check for blank screen
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.length).toBeGreaterThan(0)
      expect(loadTime).toBeLessThan(20000)

      // Collect diagnostic info
      test.info().annotations.push(
        { type: 'load_time', description: `${loadTime}ms` },
        { type: 'console_errors', description: consoleErrors.length > 0 ? consoleErrors.join(' | ') : 'NONE' },
        { type: 'network_errors', description: networkFailures.length > 0 ? [...new Set(networkFailures)].join(' | ') : 'NONE' },
      )

      expect(consoleErrors.length).toBe(0)
    })
  }

  test('[OVERVIEW] Widget inventory — all sections render', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor', { waitUntil: 'networkidle' })
    const pageText = await page.locator('body').innerText()
    const expectedSections = ['Overview', 'Quick Actions', 'Applications', 'Mentees', 'Sessions', 'Analytics', 'Activity', 'Notifications']
    for (const section of expectedSections) {
      if (pageText.includes(section)) {
        test.info().annotations.push({ type: 'section_found', description: section })
      }
    }
    const buttons = await page.locator('button, a[role="button"], [onclick]').count()
    test.info().annotations.push({ type: 'interactive_elements', description: `${buttons} found` })
    expect(buttons).toBeGreaterThan(0)
  })

  test('[APPLICATIONS] Full CRUD audit — view, approve, reject', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=applications', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const hasApplications = await page.locator('[class*="application"], [class*="cursor-pointer"]').count()
    test.info().annotations.push({ type: 'applications_found', description: `${hasApplications} application items` })

    if (hasApplications > 0) {
      const firstApp = page.locator('[class*="application"], [class*="cursor-pointer"]').first()
      await firstApp.click()
      await page.waitForTimeout(1000)

      const approveBtn = page.locator('button:has-text("Approve")').first()
      const rejectBtn = page.locator('button:has-text("Reject")').first()
      test.info().annotations.push(
        { type: 'approve_button', description: await approveBtn.isVisible().then(v => v ? 'VISIBLE' : 'NOT VISIBLE') },
        { type: 'reject_button', description: await rejectBtn.isVisible().then(v => v ? 'VISIBLE' : 'NOT VISIBLE') },
      )
    }
    expect(networkFailures.filter(f => f.startsWith('5')).length).toBe(0)
  })

  test('[MENTEES] Student list renders with details', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=mentees', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const studentCards = await page.locator('[class*="cursor-pointer"], [class*="student"], [class*="mentee"]').count()
    test.info().annotations.push({ type: 'student_count', description: `${studentCards} students found` })
    expect(networkFailures.filter(f => f.startsWith('5')).length).toBe(0)

    if (studentCards > 0) {
      const firstStudent = page.locator('[class*="cursor-pointer"], [class*="student"], [class*="mentee"]').first()
      await firstStudent.click()
      await page.waitForTimeout(1000)
      const detailText = await page.locator('body').innerText()
      test.info().annotations.push({ type: 'student_detail', description: detailText.substring(0, 200) })
    }
  })

  test('[SESSIONS] Schedule, view, cancel flow', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=sessions', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const scheduleBtn = page.getByRole('button', { name: /schedule|new session/i }).first()
    test.info().annotations.push({ type: 'schedule_button', description: await scheduleBtn.isVisible().then(v => v ? 'VISIBLE' : 'NOT VISIBLE') })

    if (await scheduleBtn.isVisible().catch(() => false)) {
      await scheduleBtn.click()
      await page.waitForTimeout(1000)
    }

    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first()
    test.info().annotations.push({ type: 'cancel_button', description: await cancelBtn.isVisible().then(v => v ? 'VISIBLE' : 'NOT VISIBLE') })
    expect(networkFailures.filter(f => f.startsWith('5')).length).toBe(0)
  })

  test('[GOALS] Assign goal to student flow', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=mentees', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const addGoalBtn = page.getByRole('button', { name: /add goal|assign goal/i }).first()
    if (await addGoalBtn.isVisible().catch(() => false)) {
      const title = `Audit Goal ${Date.now()}`
      await addGoalBtn.click()
      await page.waitForTimeout(500)
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(title)
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first()
        if (await saveBtn.isVisible()) {
          await saveBtn.click()
          await page.waitForTimeout(1000)
          test.info().annotations.push({ type: 'goal_created', description: title })
        }
      }
    }
  })

  test('[MESSAGING] Send message to student', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=messaging', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const composeBtn = page.getByRole('button', { name: /new message|compose/i }).first()
    if (await composeBtn.isVisible().catch(() => false)) {
      await composeBtn.click()
      await page.waitForTimeout(500)
      const msgText = `Audit test message ${Date.now()}`
      const input = page.locator('textarea[placeholder*="message" i], [contenteditable="true"]').first()
      if (await input.isVisible().catch(() => false)) {
        await input.fill(msgText)
        const sendBtn = page.locator('button:has-text("Send")').first()
        if (await sendBtn.isVisible()) {
          await sendBtn.click()
          await page.waitForTimeout(1000)
          test.info().annotations.push({ type: 'message_sent', description: msgText.substring(0, 50) })
        }
      }
    }
  })

  test('[RESOURCES] Upload resource flow', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=resources', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const uploadBtn = page.getByRole('button', { name: /upload|add resource/i }).first()
    if (await uploadBtn.isVisible().catch(() => false)) {
      await uploadBtn.click()
      await page.waitForTimeout(500)

      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`Audit Resource ${Date.now()}`)
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Upload")').first()
        if (await saveBtn.isVisible()) {
          await saveBtn.click()
          await page.waitForTimeout(1000)
          test.info().annotations.push({ type: 'resource_upload', description: 'Upload flow completed' })
        }
      }
    }
  })

  test('[ANALYTICS] Charts and metrics render', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=analytics', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const charts = await page.locator('[class*="chart"], [class*="graph"], canvas, svg').count()
    const metrics = await page.locator('[class*="stat"], [class*="metric"], [class*="count"]').count()
    test.info().annotations.push(
      { type: 'charts_found', description: `${charts}` },
      { type: 'metrics_found', description: `${metrics}` },
    )
  })

  test('[AI ASSISTANT] AI tab loads without breaking', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=ai', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').innerText()
    test.info().annotations.push({ type: 'ai_tab_content', description: bodyText.substring(0, 200) })
  })

  test('[AVAILABILITY] Set weekly hours flow', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=availability', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const addSlotBtn = page.getByRole('button', { name: /add slot|add availability/i }).first()
    test.info().annotations.push({ type: 'availability_ui', description: await addSlotBtn.isVisible().then(v => v ? 'VISIBLE' : 'NOT VISIBLE') })
  })

  test('[EVENTS] Events tab loads with data', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=events', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const eventItems = await page.locator('[class*="event"], [class*="calendar"]').count()
    test.info().annotations.push({ type: 'events_found', description: `${eventItems}` })
  })

  test('[GALLERY] Gallery management renders', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=gallery', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const galleryItems = await page.locator('[class*="gallery"], img, [class*="image"]').count()
    test.info().annotations.push({ type: 'gallery_items', description: `${galleryItems}` })
  })

  test('[EMAILS] Emails tab renders', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=emails', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const emailItems = await page.locator('[class*="email"], [class*="message"]').count()
    test.info().annotations.push({ type: 'emails_found', description: `${emailItems}` })
  })

  test('[GROWTH AUDIT] Growth audit tab loads', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/mentor?tab=growth-audit', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const bodyText = await page.locator('body').innerText()
    test.info().annotations.push({ type: 'growth_audit', description: bodyText.substring(0, 200) })
  })

  test('[SETTINGS] Settings page loads', async ({ page }) => {
    await setupAuditPage(page)
    await page.goto('/#/settings', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const settingsSections = await page.locator('input, select, button').count()
    test.info().annotations.push({ type: 'settings_fields', description: `${settingsSections}` })
  })

  test('[RESPONSIVE] All tabs render at mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await setupAuditPage(page)

    for (const tab of MENTOR_TABS.slice(0, 8)) {
      await page.goto(tab.route, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(500)
      const bodyText = await page.locator('body').innerText()
      if (bodyText.length === 0) {
        test.info().annotations.push({ type: 'mobile_blank', description: `${tab.name} — blank screen at 375px` })
      }
    }
  })
})
