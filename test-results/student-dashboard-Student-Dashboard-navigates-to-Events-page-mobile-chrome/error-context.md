# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-dashboard.spec.ts >> Student Dashboard >> navigates to Events page
- Location: e2e\student-dashboard.spec.ts:214:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Events' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Mentorino" [ref=e5] [cursor=pointer]:
        - /url: "#/"
      - generic [ref=e6]:
        - link "S" [ref=e7] [cursor=pointer]:
          - /url: "#/settings"
        - button [ref=e8]:
          - img [ref=e9]
    - main [ref=e10]:
      - generic [ref=e12]:
        - generic [ref=e14]:
          - paragraph [ref=e15]: Good Evening
          - heading "Test." [level=1] [ref=e16]
        - main [ref=e17]:
          - generic [ref=e19]:
            - generic [ref=e22]:
              - generic [ref=e23]:
                - generic [ref=e24]:
                  - heading "Your Trajectory." [level=3] [ref=e25]
                  - paragraph [ref=e28]: Authorized Member Access Active
                - generic [ref=e29]:
                  - paragraph [ref=e30]: Today's Focus
                  - list [ref=e31]:
                    - listitem [ref=e32]:
                      - generic [ref=e34]: Submit updated resume PDF
                    - listitem [ref=e35]:
                      - generic [ref=e37]: Read PM Interview Guide
                - button "2 Second Application Required Complete your profile details for audit review" [ref=e38]:
                  - generic [ref=e39]: "2"
                  - generic [ref=e40]:
                    - paragraph [ref=e41]: Second Application Required
                    - paragraph [ref=e42]: Complete your profile details for audit review
                  - img [ref=e43]
              - generic [ref=e45]:
                - generic [ref=e46]:
                  - paragraph [ref=e47]: Current Program
                  - paragraph [ref=e48]: Not enrolled in a program.
                - generic [ref=e49]:
                  - paragraph [ref=e50]: Mentor
                  - paragraph [ref=e51]: Peter Mannarino
                - generic [ref=e52]:
                  - paragraph [ref=e53]: Progress
                  - generic [ref=e55]:
                    - generic [ref=e56]: ░░░░░░░░░░
                    - generic [ref=e57]: 0%
                - generic [ref=e59]:
                  - paragraph [ref=e60]: Next Session
                  - paragraph [ref=e61]: Saturday • 12:35 AM
            - generic [ref=e62]:
              - generic [ref=e63] [cursor=pointer]:
                - generic [ref=e64]:
                  - img [ref=e66]
                  - img [ref=e69]
                - paragraph [ref=e71]: Sessions
                - paragraph [ref=e72]: "2"
              - generic [ref=e73] [cursor=pointer]:
                - generic [ref=e74]:
                  - img [ref=e76]
                  - img [ref=e79]
                - paragraph [ref=e81]: Active Tasks
                - paragraph [ref=e82]: "2"
```

# Test source

```ts
  116 | 
  117 |     // Student timeline
  118 |     if (url.includes('/rest/v1/student_timeline_events')) {
  119 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  120 |         { id: 'ste-1', student_id: 'mock-student-1', type: 'goal_completed', title: 'Completed Resume Goal', description: 'Successfully completed the Complete Resume goal', timestamp: '2025-06-15T00:00:00Z' },
  121 |       ]) });
  122 |       return;
  123 |     }
  124 | 
  125 |     // Catch-all for other REST endpoints
  126 |     if (url.includes('/rest/v1/')) {
  127 |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  128 |       return;
  129 |     }
  130 | 
  131 |     await route.continue();
  132 |   });
  133 | 
  134 |   await page.goto('/#/student');
  135 | }
  136 | 
  137 | test.describe('Student Dashboard', () => {
  138 |   test.beforeEach(async ({ page }) => {
  139 |     await setupStudentPage(page);
  140 |   });
  141 | 
  142 |   test('redirects to student dashboard when authenticated', async ({ page }) => {
  143 |     await expect(page).toHaveURL(/#\/student/, { timeout: 15000 });
  144 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  145 |   });
  146 | 
  147 |   test('shows sidebar with student navigation links', async ({ page }) => {
  148 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  149 |     const navItems = ['Overview', 'Programs', 'Journal', 'Goals', 'Tasks', 'Sessions', 'Messages', 'Events'];
  150 |     for (const item of navItems) {
  151 |       await expect(page.getByRole('link', { name: item })).toBeVisible();
  152 |     }
  153 |   });
  154 | 
  155 |   test('navigates to Goals page', async ({ page }) => {
  156 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  157 |     await page.getByRole('link', { name: 'Goals' }).click();
  158 |     await expect(page).toHaveURL(/#\/student\/goals/);
  159 |     await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible();
  160 |   });
  161 | 
  162 |   test('navigates to Tasks page', async ({ page }) => {
  163 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  164 |     await page.getByRole('link', { name: 'Tasks' }).click();
  165 |     await expect(page).toHaveURL(/#\/student\/tasks/);
  166 |     await expect(page.getByRole('heading', { name: 'Active Tasks' })).toBeVisible();
  167 |   });
  168 | 
  169 |   test('navigates to Journal page', async ({ page }) => {
  170 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  171 |     await page.getByRole('link', { name: 'Journal' }).click();
  172 |     await expect(page).toHaveURL(/#\/student\/journal/);
  173 |     await expect(page.getByRole('heading', { name: 'Your Journal' })).toBeVisible();
  174 |   });
  175 | 
  176 |   test('navigates to Sessions page', async ({ page }) => {
  177 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  178 |     await page.getByRole('link', { name: 'Sessions' }).click();
  179 |     await expect(page).toHaveURL(/#\/student\/sessions/);
  180 |   });
  181 | 
  182 |   test('shows goals list with progress', async ({ page }) => {
  183 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  184 |     await page.getByRole('link', { name: 'Goals' }).click();
  185 |     await expect(page).toHaveURL(/#\/student\/goals/);
  186 |     await expect(page.getByText('Complete Resume')).toBeVisible();
  187 |     await expect(page.getByText('Conduct Informational Interviews')).toBeVisible();
  188 |   });
  189 | 
  190 |   test('shows journal entries on Journal page', async ({ page }) => {
  191 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  192 |     await page.getByRole('link', { name: 'Journal' }).click();
  193 |     await expect(page).toHaveURL(/#\/student\/journal/);
  194 |     await expect(page.getByText(/daily Reflection/i)).toBeVisible();
  195 |     await expect(page.getByText(/weekly Reflection/i)).toBeVisible();
  196 |     await expect(page.getByText(/Today was very productive/i)).toBeVisible();
  197 |   });
  198 | 
  199 |   test('shows upcoming sessions with meeting links', async ({ page }) => {
  200 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  201 |     await page.getByRole('link', { name: 'Sessions' }).click();
  202 |     await expect(page).toHaveURL(/#\/student\/sessions/);
  203 |     await expect(page.getByText('Introductory Call')).toBeVisible();
  204 |     await expect(page.getByText('Resume Review Session')).toBeVisible();
  205 |   });
  206 | 
  207 |   test('shows tasks list with status', async ({ page }) => {
  208 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  209 |     await page.getByRole('link', { name: 'Tasks' }).click();
  210 |     await expect(page).toHaveURL(/#\/student\/tasks/);
  211 |     await expect(page.getByText('Submit updated resume PDF')).toBeVisible();
  212 |   });
  213 | 
  214 |   test('navigates to Events page', async ({ page }) => {
  215 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
> 216 |     await page.getByRole('link', { name: 'Events' }).click();
      |                                                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  217 |     await expect(page).toHaveURL(/#\/student\/events/);
  218 |   });
  219 | 
  220 |   test('navigates to Programs page', async ({ page }) => {
  221 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  222 |     await page.getByRole('link', { name: 'Programs' }).click();
  223 |     await expect(page).toHaveURL(/#\/student\/programs/);
  224 |   });
  225 | 
  226 |   test('navigates back to overview from sub-page', async ({ page }) => {
  227 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  228 |     await page.getByRole('link', { name: 'Goals' }).click();
  229 |     await expect(page).toHaveURL(/#\/student\/goals/);
  230 |     await page.getByRole('link', { name: 'Overview' }).click();
  231 |     await expect(page).toHaveURL(/#\/student\/?$/);
  232 |   });
  233 | });
  234 | 
```