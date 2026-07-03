# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: application.spec.ts >> Mentorship Application Flow >> step 1: navigates to step 2 when fields filled
- Location: e2e\application.spec.ts:23:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="+1 (555) 000-0000"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - main [ref=e4]:
    - generic [ref=e6]:
      - button "Go back" [ref=e7]:
        - img [ref=e8]
      - generic [ref=e11]:
        - generic [ref=e12]: PROGRAM AUDIT • Step 1
        - generic [ref=e13]: 25%
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - heading "PROFILE & GOALS" [level=2] [ref=e19]
            - paragraph [ref=e20]: Questions 1-4
          - generic [ref=e21]:
            - generic [ref=e22]:
              - text: 1. What type of Mentor are you seeking?
              - combobox [ref=e23]:
                - option "Select a mentor type..." [disabled]
                - option "Career Strategist" [selected]
                - option "Academic Guide"
                - option "Research Mentor"
                - option "Industry Expert"
                - option "Life Coach"
            - generic [ref=e24]:
              - text: 2. Name
              - textbox "John Doe" [active] [ref=e26]: Peter Smith
            - generic [ref=e27]:
              - generic [ref=e28]:
                - text: 3. Phone Number
                - generic [ref=e29]:
                  - combobox [ref=e30]:
                    - option "US +1" [selected]
                    - option "CA +1"
                    - option "UK +44"
                    - option "AU +61"
                    - option "IN +91"
                    - option "CN +86"
                    - option "DE +49"
                    - option "FR +33"
                    - option "JP +81"
                    - option "RU +7"
                    - option "BR +55"
                    - option "IT +39"
                    - option "ES +34"
                    - option "KR +82"
                    - option "MX +52"
                    - option "AE +971"
                    - option "SG +65"
                    - option "IL +972"
                    - option "IE +353"
                    - option "NL +31"
                    - option "SE +46"
                    - option "NO +47"
                    - option "DK +45"
                    - option "FI +358"
                    - option "NZ +64"
                    - option "ZA +27"
                  - textbox "(555) 000-0000" [ref=e31]
              - generic [ref=e32]:
                - text: 4. Email
                - textbox "john@example.com" [ref=e34]
        - generic [ref=e35]:
          - button "Back" [disabled]:
            - img
            - text: Back
          - button "Next Phase" [ref=e36]:
            - text: Next Phase
            - img [ref=e37]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Mentorship Application Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/#/apply');
  6  |   });
  7  | 
  8  |   test('displays step 1 of the application form', async ({ page }) => {
  9  |     await expect(page.getByText('PROFILE & GOALS')).toBeVisible();
  10 |     await expect(page.getByText('PROGRAM AUDIT')).toBeVisible();
  11 |     await expect(page.getByText('Step 1')).toBeVisible();
  12 |   });
  13 | 
  14 |   test('shows progress bar at 25% for step 1', async ({ page }) => {
  15 |     await expect(page.getByText('25%')).toBeVisible();
  16 |   });
  17 | 
  18 |   test('step 1: validates required fields on next', async ({ page }) => {
  19 |     await page.getByRole('button', { name: /next/i }).click();
  20 |     await expect(page.getByText(/fill in all identity fields/i)).toBeVisible();
  21 |   });
  22 | 
  23 |   test('step 1: navigates to step 2 when fields filled', async ({ page }) => {
  24 |     await page.locator('select').first().selectOption('Career Strategist');
  25 |     await page.locator('input[placeholder="John Doe"]').fill('Peter Smith');
> 26 |     await page.locator('input[placeholder="+1 (555) 000-0000"]').fill('+1 555-1234');
     |                                                                  ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  27 |     await page.locator('input[placeholder="john@example.com"]').fill('peter@test.com');
  28 | 
  29 |     await page.getByRole('button', { name: /next/i }).click();
  30 | 
  31 |     await expect(page.getByText('MEETING PREF')).toBeVisible();
  32 |     await expect(page.getByText('Step 2')).toBeVisible();
  33 |     await expect(page.getByText('50%')).toBeVisible();
  34 |   });
  35 | 
  36 |   test('complete full application to submission screen', async ({ page }) => {
  37 |     // Step 1
  38 |     await page.locator('select').first().selectOption('Academic Guide');
  39 |     await page.locator('input[placeholder="John Doe"]').fill('Jane Smith');
  40 |     await page.locator('input[placeholder="+1 (555) 000-0000"]').fill('+1 555-5678');
  41 |     await page.locator('input[placeholder="john@example.com"]').fill('jane@test.com');
  42 |     await page.getByRole('button', { name: /next/i }).click();
  43 | 
  44 |     // Step 2
  45 |     await page.getByRole('button', { name: 'Virtual' }).click();
  46 |     await page.locator('select').last().selectOption('Bi-weekly');
  47 |     await page.getByRole('button', { name: /next/i }).click();
  48 | 
  49 |     // Step 3
  50 |     await expect(page.getByText('THE CORE')).toBeVisible();
  51 |     await page.locator('textarea').fill('I want to advance my career in cybersecurity and get certified.');
  52 |     await page.getByRole('button', { name: /next/i }).click();
  53 | 
  54 |     // Step 4
  55 |     await expect(page.getByText('COMMITMENT & DOCUMENTS')).toBeVisible();
  56 |     await page.locator('input[placeholder="https://linkedin.com/in/username"]').fill('https://linkedin.com/in/jane');
  57 | 
  58 |     // Submit
  59 |     await page.getByRole('button', { name: /confirm inquiry/i }).click();
  60 | 
  61 |     // The app either shows submission success or an error toast
  62 |     await page.waitForTimeout(2000);
  63 |     const successState = await page.getByText('Application Sent').isVisible().catch(() => false);
  64 | 
  65 |     if (successState) {
  66 |       await expect(page.getByText('Peter is currently reviewing')).toBeVisible();
  67 |       await expect(page.getByRole('button', { name: /return home/i })).toBeVisible();
  68 |     }
  69 |   });
  70 | });
  71 | 
```