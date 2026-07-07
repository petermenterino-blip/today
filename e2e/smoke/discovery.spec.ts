import { test, expect, Page } from '@playwright/test'

interface RouteInfo {
  path: string
  status: number
  title: string
  interactiveElements: string[]
  consoleErrors: string[]
  networkErrors: string[]
  isProtected: boolean | 'unknown'
  hasAuthForm: boolean
}

async function discoverRoute(page: Page, path: string): Promise<RouteInfo> {
  const consoleErrors: string[] = []
  const networkErrors: string[] = []
  const interactiveElements: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  page.on('pageerror', (err) => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`)
  })

  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      networkErrors.push(`${resp.status()} ${resp.url()}`)
    }
  })

  let status = 200
  try {
    const resp = await page.goto(path, { waitUntil: 'networkidle', timeout: 30000 })
    status = resp?.status() ?? 0
  } catch {
    status = 0
    return {
      path,
      status,
      title: 'FAILED TO LOAD',
      interactiveElements: [],
      consoleErrors,
      networkErrors,
      isProtected: 'unknown',
      hasAuthForm: false,
    }
  }

  await page.waitForTimeout(2000)

  const title = await page.title().catch(() => '')
  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '')

  const elements = await page.evaluate(() => {
    const tags = ['a', 'button', 'input', 'select', 'textarea', '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[role="dialog"]', '[role="alertdialog"]', '[role="menu"]', '[tabindex]']
    const found = new Set<string>()
    tags.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const text = (el as HTMLElement).innerText?.trim() || (el as HTMLInputElement).placeholder || el.getAttribute('aria-label') || el.tagName
        if (text) found.add(text.substring(0, 100))
      })
    })
    return Array.from(found).slice(0, 50)
  })

  const hasAuthForm = await page.locator('[placeholder="name@example.com"], [placeholder="••••••••"], button[type="submit"]').first().isVisible().catch(() => false)

  const isProtected = bodyText.includes('Sign In') && bodyText.includes('INVITATION ONLY') ? true :
                      bodyText.includes('Welcome to the Program') || bodyText.includes('Dashboard') ? false : 'unknown'

  return {
    path,
    status,
    title: title || bodyText.substring(0, 100),
    interactiveElements: elements,
    consoleErrors,
    networkErrors,
    isProtected: isProtected as boolean | 'unknown',
    hasAuthForm,
  }
}

const CRAWL_ROUTES = [
  '/', '/#/about', '/#/programs', '/#/consultation', '/#/faq', '/#/contact',
  '/#/gallery', '/#/mentorship', '/#/auth', '/#/apply', '/#/pending-approval',
  '/#/booking', '/#/book-call', '/#/store', '/#/survey', '/#/privacy',
  '/#/terms', '/#/reset-password', '/#/financials', '/#/consultation-overview',
  '/#/settings', '/#/dashboard', '/#/student', '/#/mentor',
  '/#/student/goals', '/#/student/tasks', '/#/student/journal',
  '/#/student/sessions', '/#/student/messages', '/#/student/resources',
  '/#/student/events', '/#/student/profile', '/#/student/programs',
  '/#/student/forms', '/#/student/reviews', '/#/student/files',
  '/#/mentor?tab=messaging', '/#/mentor?tab=mentees', '/#/mentor?tab=applications',
  '/#/mentor?tab=bookings', '/#/mentor?tab=sessions', '/#/mentor?tab=programs',
  '/#/mentor?tab=program-progress', '/#/mentor?tab=feedback', '/#/mentor?tab=resources',
  '/#/mentor?tab=events', '/#/mentor?tab=analytics', '/#/mentor?tab=ai',
  '/#/mentor?tab=gallery', '/#/mentor?tab=growth-audit',
]

test.describe('Application Discovery', () => {
  let allRoutes: RouteInfo[] = []

  for (const route of CRAWL_ROUTES) {
    test(`discover: ${route}`, async ({ page }) => {
      const info = await discoverRoute(page, route)
      allRoutes.push(info)

      console.log(`\n=== ${route} ===`)
      console.log(`  Status: ${info.status}`)
      console.log(`  Title: ${info.title}`)
      console.log(`  Protected: ${info.isProtected}`)
      console.log(`  Console Errors: ${info.consoleErrors.length}`)
      console.log(`  Network Errors: ${info.networkErrors.length}`)
      console.log(`  Elements: ${info.interactiveElements.length}`)

      if (info.consoleErrors.length > 0) {
        console.log(`  === CONSOLE ERRORS ===`)
        info.consoleErrors.forEach(e => console.log(`    ${e}`))
      }
      if (info.networkErrors.length > 0) {
        console.log(`  === NETWORK ERRORS ===`)
        info.networkErrors.forEach(e => console.log(`    ${e}`))
      }

      expect(info.status).toBeGreaterThanOrEqual(200)
      expect(info.status).toBeLessThan(500)
    })
  }
})
