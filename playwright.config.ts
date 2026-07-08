import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://today-ten-zeta.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'smoke',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
      testMatch: /regression-smoke\.spec\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
      testMatch: /e2e\/tests\//,
      testIgnore: [/debug/, /\.setup\.ts/, /isolation/, /regression-smoke/],
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
      testMatch: /e2e\/tests\//,
      testIgnore: [/debug/, /\.setup\.ts/, /isolation/, /regression-smoke/],
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
      testMatch: /e2e\/tests\//,
      testIgnore: [/debug/, /\.setup\.ts/, /isolation/, /regression-smoke/],
    },
    {
      name: 'mobile-chrome',
      dependencies: ['setup'],
      use: { ...devices['Pixel 9'] },
      testMatch: /e2e\/tests\//,
      testIgnore: [/debug/, /\.setup\.ts/, /isolation/, /regression-smoke/],
    },
    {
      name: 'mobile-safari',
      dependencies: ['setup'],
      use: { ...devices['iPhone 16'] },
      testMatch: /e2e\/tests\//,
      testIgnore: [/debug/, /\.setup\.ts/, /isolation/, /regression-smoke/],
    },
  ],
})
