# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-dashboard.spec.ts >> Student Dashboard >> redirects to student dashboard when authenticated
- Location: e2e\student-dashboard.spec.ts:126:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /#\/student/
Received string:  "http://localhost:3000/#/auth"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    32 × unexpected value "http://localhost:3000/#/auth"

```

```yaml
- region "Notifications alt+T"
- main:
  - link "BACK":
    - /url: "#/"
    - img
    - text: BACK
  - text: M
  - heading "SIGN IN" [level=1]
  - paragraph: WELCOME BACK TO MENTORINO WORKSPACE
  - paragraph: INVITATION ONLY
  - paragraph: Accounts are created by invitation only. Submit an application first — if approved, you will receive your login credentials.
  - text: EMAIL ADDRESS
  - textbox "name@example.com"
  - text: PASSWORD
  - button "FORGOT?"
  - textbox "••••••••"
  - button "SIGN IN"
  - link "DON'T HAVE AN ACCOUNT? APPLY HERE":
    - /url: "#/apply"
```

# Test source

```ts
  27  |           aud: 'authenticated',
  28  |           role: 'authenticated',
  29  |           email: 'student@mentorino.com',
  30  |           email_confirmed_at: '2025-01-01T00:00:00Z',
  31  |           phone: '',
  32  |           confirmation_sent_at: '2025-01-01T00:00:00Z',
  33  |           confirmed_at: '2025-01-01T00:00:00Z',
  34  |           last_sign_in_at: '2025-01-01T00:00:00Z',
  35  |           created_at: '2025-01-01T00:00:00Z',
  36  |           updated_at: '2025-01-01T00:00:00Z',
  37  |           user_metadata: { full_name: 'Test Student' },
  38  |           app_metadata: { provider: 'email' },
  39  |         },
  40  |       };
  41  |       localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
  42  |       localStorage.setItem('supabase.auth.token-user', JSON.stringify({ user: mockSession.user }));
  43  |       localStorage.setItem('mentorino_seed_version', 'v4');
  44  |       localStorage.setItem('mentorino_sessions', JSON.stringify([]));
  45  |       localStorage.setItem('mentorino_applications', JSON.stringify([]));
  46  |       localStorage.setItem('mentorino_programs', JSON.stringify([]));
  47  |       localStorage.setItem('mock_bookings_v2', JSON.stringify([]));
  48  |       localStorage.setItem('mock_events_v2', JSON.stringify([]));
  49  |       localStorage.setItem('mentorino_resources', JSON.stringify([]));
  50  |     });
  51  | 
  52  |     // ── 2. Intercept ALL requests to supabase.co ─────────────────────
  53  |     await page.route((url) => url.hostname.includes('supabase.co'), async (route) => {
  54  |       const url = route.request().url();
  55  | 
  56  |       // Auth endpoints
  57  |       if (url.includes('/auth/v1/')) {
  58  |         // Return a valid user for session validation
  59  |         const body = url.includes('/token')
  60  |           ? {
  61  |               access_token: 'mock-student-access-token',
  62  |               token_type: 'bearer',
  63  |               expires_in: 3600,
  64  |               expires_at: Math.floor(Date.now() / 1000) + 3600,
  65  |               refresh_token: 'mock-student-refresh-token',
  66  |               user: { id: 'mock-student-1', email: 'student@mentorino.com', role: 'authenticated' },
  67  |             }
  68  |           : {
  69  |               id: 'mock-student-1',
  70  |               email: 'student@mentorino.com',
  71  |               role: 'authenticated',
  72  |               aud: 'authenticated',
  73  |               created_at: '2025-01-01T00:00:00Z',
  74  |               user_metadata: { full_name: 'Test Student' },
  75  |             };
  76  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  77  |         return;
  78  |       }
  79  | 
  80  |       // Profile endpoint
  81  |       if (url.includes('/rest/v1/profiles')) {
  82  |         await route.fulfill({
  83  |           status: 200,
  84  |           contentType: 'application/json',
  85  |           body: JSON.stringify([{
  86  |             id: 'mock-student-1',
  87  |             email: 'student@mentorino.com',
  88  |             name: 'Test Student',
  89  |             first_name: 'Test',
  90  |             last_name: 'Student',
  91  |             role: 'student',
  92  |             application_status: 'approved',
  93  |             created_at: '2025-01-01T00:00:00Z',
  94  |           }]),
  95  |         });
  96  |         return;
  97  |       }
  98  | 
  99  |       // Goals endpoint
  100 |       if (url.includes('/rest/v1/goals')) {
  101 |         await route.fulfill({
  102 |           status: 200,
  103 |           contentType: 'application/json',
  104 |           body: JSON.stringify([
  105 |             { id: 'goal-1', student_id: 'mock-student-1', title: 'Complete Resume', description: 'Update resume', progress_percentage: 100, status: 'completed', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-15T00:00:00Z' },
  106 |             { id: 'goal-2', student_id: 'mock-student-1', title: 'Conduct Informational Interviews', description: 'Reach out to PMs', progress_percentage: 40, status: 'in_progress', created_at: '2025-06-05T00:00:00Z', updated_at: '2025-06-18T00:00:00Z' },
  107 |           ]),
  108 |         });
  109 |         return;
  110 |       }
  111 | 
  112 |       // All other REST endpoints
  113 |       if (url.includes('/rest/v1/')) {
  114 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  115 |         return;
  116 |       }
  117 | 
  118 |       // Fallback
  119 |       await route.continue();
  120 |     });
  121 | 
  122 |     // ── 3. Navigate to student dashboard ────────────────────────────
  123 |     await page.goto('/#/student');
  124 |   });
  125 | 
  126 |   test('redirects to student dashboard when authenticated', async ({ page }) => {
> 127 |     await expect(page).toHaveURL(/#\/student/, { timeout: 15000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  128 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  129 |   });
  130 | 
  131 |   test('shows sidebar with student navigation links', async ({ page }) => {
  132 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  133 |     const navItems = ['Overview', 'Programs', 'Journal', 'Goals', 'Tasks', 'Sessions', 'Messages', 'Events'];
  134 |     for (const item of navItems) {
  135 |       await expect(page.getByRole('link', { name: item })).toBeVisible();
  136 |     }
  137 |   });
  138 | 
  139 |   test('navigates to Goals page', async ({ page }) => {
  140 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  141 |     await page.getByRole('link', { name: 'Goals' }).click();
  142 |     await expect(page).toHaveURL(/#\/student\/goals/);
  143 |     await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible();
  144 |   });
  145 | 
  146 |   test('navigates to Tasks page', async ({ page }) => {
  147 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  148 |     await page.getByRole('link', { name: 'Tasks' }).click();
  149 |     await expect(page).toHaveURL(/#\/student\/tasks/);
  150 |     await expect(page.getByRole('heading', { name: 'Active Tasks' })).toBeVisible();
  151 |   });
  152 | 
  153 |   test('navigates to Journal page', async ({ page }) => {
  154 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  155 |     await page.getByRole('link', { name: 'Journal' }).click();
  156 |     await expect(page).toHaveURL(/#\/student\/journal/);
  157 |     await expect(page.getByRole('heading', { name: 'Your Journal' })).toBeVisible();
  158 |   });
  159 | 
  160 |   test('navigates to Sessions page', async ({ page }) => {
  161 |     await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  162 |     await page.getByRole('link', { name: 'Sessions' }).click();
  163 |     await expect(page).toHaveURL(/#\/student\/sessions/);
  164 |   });
  165 | });
  166 | 
```