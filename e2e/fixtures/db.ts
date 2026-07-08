import { expect } from '@playwright/test'

export class DbFixture {
  private readonly supabaseUrl: string
  private readonly serviceRoleKey: string

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://jnazlfhhzxrocvxvmkkc.supabase.co'
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }

  private getAuthHeader() {
    return { apikey: this.serviceRoleKey, Authorization: `Bearer ${this.serviceRoleKey}` }
  }

  async query(sql: string): Promise<any> {
    const url = `${this.supabaseUrl}/rest/v1/rpc/exec_sql`
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify({ query: sql })
      })
      return resp.ok ? await resp.json() : null
    } catch {
      return null
    }
  }

  async directFetch(table: string, options?: { select?: string; eq?: Record<string, string>; limit?: number }): Promise<any> {
    let url = `${this.supabaseUrl}/rest/v1/${table}?select=${options?.select || '*'}`
    if (options?.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        url += `&${key}=eq.${encodeURIComponent(value)}`
      }
    }
    if (options?.limit) url += `&limit=${options.limit}`
    try {
      const resp = await fetch(url, { headers: this.getAuthHeader() })
      return resp.ok ? await resp.json() : []
    } catch {
      return []
    }
  }

  async assertRowExists(table: string, column: string, value: string) {
    const rows = await this.directFetch(table, { eq: { [column]: value }, limit: 1 })
    expect(rows.length).toBeGreaterThanOrEqual(1)
    return rows[0]
  }

  async assertRowCount(table: string, column: string, value: string, expectedCount: number) {
    const rows = await this.directFetch(table, { eq: { [column]: value } })
    expect(rows.length).toBe(expectedCount)
  }
}
