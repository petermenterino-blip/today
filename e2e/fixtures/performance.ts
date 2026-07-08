import { expect } from '@playwright/test'
import { Page } from '@playwright/test'

export class PerformanceFixture {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async measurePageLoad(url: string): Promise<number> {
    const start = Date.now()
    await this.page.goto(url, { waitUntil: 'networkidle' })
    return Date.now() - start
  }

  async measureApiCall(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any): Promise<number> {
    const start = Date.now()
    await this.page.request.fetch(url, { method, data: body })
    return Date.now() - start
  }

  async assertLoadTimeUnder(url: string, thresholdMs: number) {
    const loadTime = await this.measurePageLoad(url)
    expect(loadTime).toBeLessThan(thresholdMs)
  }

  async getLCP(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          resolve(entries.length > 0 ? entries[entries.length - 1].startTime : 0)
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        setTimeout(() => resolve(0), 5000)
      })
    })
  }

  async getFCP(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          resolve(entries.length > 0 ? entries[0].startTime : 0)
        }).observe({ type: 'paint', buffered: true })
        setTimeout(() => resolve(0), 5000)
      })
    })
  }

  async getCLS(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise(resolve => {
        let cls = 0
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += (entry as any).value || 0
          }
        }).observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => resolve(cls), 3000)
      })
    })
  }
}
