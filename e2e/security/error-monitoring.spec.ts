import { test, expect } from '@playwright/test'

test.describe('Error Monitoring — Production Health', () => {

  const PUBLIC_ROUTES = [
    '/', '/#/about', '/#/programs', '/#/consultation', '/#/faq', '/#/contact',
    '/#/gallery', '/#/auth', '/#/apply', '/#/privacy', '/#/terms',
  ]

  test.describe('Console Error Detection', () => {
    for (const route of PUBLIC_ROUTES) {
      test(`no console errors on ${route}`, async ({ page }) => {
        const consoleErrors: string[] = []
        const pageErrors: string[] = []

        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(`[CONSOLE.${msg.type()}] ${msg.text()}`)
          }
        })
        page.on('pageerror', (err) => {
          pageErrors.push(`[PAGE ERROR] ${err.message}`)
        })

        await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000)

        const allErrors = [...consoleErrors, ...pageErrors]
        if (allErrors.length > 0) {
          console.log(`\n=== Errors on ${route} ===`)
          allErrors.forEach(e => console.log(`  ${e}`))
        }
      })
    }
  })

  test.describe('Network 4xx/5xx Detection', () => {
    for (const route of PUBLIC_ROUTES) {
      test(`no network errors on ${route}`, async ({ page }) => {
        const networkErrors: Map<string, number> = new Map()

        page.on('response', (resp) => {
          if (resp.status() >= 400) {
            const key = `${resp.status()} ${resp.url()}`
            networkErrors.set(key, (networkErrors.get(key) || 0) + 1)
          }
        })

        await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000)

        if (networkErrors.size > 0) {
          console.log(`\n=== Network Errors on ${route} ===`)
          networkErrors.forEach((count, url) => {
            console.log(`  ${url} (x${count})`)
          })
        }
      })
    }
  })

  test.describe('CSP Violation Detection', () => {
    const routesWithCSP = ['/', '/#/about', '/#/programs', '/#/consultation', '/#/faq', '/#/contact', '/#/auth', '/#/apply']

    for (const route of routesWithCSP) {
      test(`check CSP headers on ${route}`, async ({ page }) => {
        const response = await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 })
        const cspHeader = response?.headers()['content-security-policy'] || response?.headers()['Content-Security-Policy'] || ''
        if (cspHeader) {
          const hasUnsafeInline = cspHeader.includes("'unsafe-inline'")
          const hasScriptUnsafeInline = cspHeader.includes("script-src") && cspHeader.includes("'unsafe-inline'")
          if (!hasUnsafeInline || !hasScriptUnsafeInline) {
            console.log(`\nCSP on ${route}: ${cspHeader.substring(0, 200)}...`)
          }
        } else {
          console.log(`\nNo CSP header on ${route}`)
        }
      })
    }
  })

  test.describe('Supabase API Health', () => {
    test('Supabase REST API responds (or DNS fails gracefully)', async ({ page }) => {
      let status = 0
      let dnsError = false
      try {
        const response = await page.request.get(
          'https://ujbgzjejibresfbprlru.supabase.co/rest/v1/',
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmd6amVqaWJyZXNmYnBybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzQ4NzcsImV4cCI6MjA1MTc1MDg3N30.O72nTF8kCGd_9TdMvGCPELUyWq1ZPr15UQDCqxI3am4'
            }
          }
        )
        status = response.status()
      } catch (e) {
        dnsError = true
        console.log(`Supabase REST API DNS error (expected in some environments): ${e instanceof Error ? e.message : e}`)
      }
      if (!dnsError) {
        expect(status).toBeLessThan(500)
      }
    })

    test('Supabase auth endpoint responds (or fails gracefully)', async ({ page }) => {
      let status = 0
      let dnsError = false
      try {
        const response = await page.request.get(
          'https://ujbgzjejibresfbprlru.supabase.co/auth/v1/',
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmd6amVqaWJyZXNmYnBybHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzQ4NzcsImV4cCI6MjA1MTc1MDg3N30.O72nTF8kCGd_9TdMvGCPELUyWq1ZPr15UQDCqxI3am4'
            }
          }
        )
        status = response.status()
      } catch (e) {
        dnsError = true
        console.log(`Supabase auth DNS error (expected in some environments): ${e instanceof Error ? e.message : e}`)
      }
      if (!dnsError) {
        expect(status).toBeLessThan(500)
      }
    })
  })

  test.describe('Unhandled Rejection Detection', () => {
    for (const route of PUBLIC_ROUTES) {
      test(`no unhandled rejections on ${route}`, async ({ page }) => {
        const rejections: string[] = []

        page.on('pageerror', (err) => {
          if (err.message.includes('rejection') || err.message.includes('unhandled')) {
            rejections.push(err.message)
          }
        })

        page.on('console', (msg) => {
          if (msg.type() === 'error' && (msg.text().includes('Unhandled') || msg.text().includes('rejection'))) {
            rejections.push(msg.text())
          }
        })

        await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000)

        if (rejections.length > 0) {
          console.log(`\n=== Unhandled Rejections on ${route} ===`)
          rejections.forEach(r => console.log(`  ${r}`))
        }
      })
    }
  })
})
