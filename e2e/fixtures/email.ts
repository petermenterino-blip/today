import { expect } from '@playwright/test'

export class EmailFixture {
  private readonly apiKey: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || ''
  }

  async captureLatestEmail(to?: string): Promise<{ subject: string; to: string; body: string } | null> {
    if (!this.apiKey) return null
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      })
      if (!resp.ok) return null
      const data = await resp.json()
      const emails = Array.isArray(data) ? data : data.data || []
      const target = to ? emails.find((e: any) => e.to?.includes(to)) : emails[0]
      if (!target) return null
      return { subject: target.subject || '', to: (target.to || []).join(', '), body: target.body || target.html || '' }
    } catch {
      return null
    }
  }

  async assertEmailSent(to?: string) {
    const email = await this.captureLatestEmail(to)
    expect(email).not.toBeNull()
    return email
  }

  async assertEmailSubjectContains(to: string, expectedText: string) {
    const email = await this.captureLatestEmail(to)
    expect(email).not.toBeNull()
    expect(email!.subject.toLowerCase()).toContain(expectedText.toLowerCase())
  }
}
