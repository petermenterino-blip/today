# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-dashboard.spec.ts >> Student Dashboard >> shows sidebar with student navigation links
- Location: e2e\student-dashboard.spec.ts:147:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Overview' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'Overview' })

```

```yaml
- region "Notifications alt+T"
- link "Mentorino":
  - /url: "#/"
- link "S":
  - /url: "#/settings"
- button:
  - img
- main:
  - paragraph: Good Evening
  - heading "Test." [level=1]
  - main:
    - heading "Your Trajectory." [level=3]
    - paragraph: Authorized Member Access Active
    - paragraph: Today's Focus
    - list:
      - listitem: Submit updated resume PDF
      - listitem: Read PM Interview Guide
    - button "2 Second Application Required Complete your profile details for audit review":
      - text: "2"
      - paragraph: Second Application Required
      - paragraph: Complete your profile details for audit review
      - img
    - paragraph: Current Program
    - paragraph: Not enrolled in a program.
    - paragraph: Mentor
    - paragraph: Peter Mannarino
    - paragraph: Progress
    - text: ░░░░░░░░░░ 0%
    - paragraph: Next Session
    - paragraph: Saturday • 12:32 AM
    - img
    - img
    - paragraph: Sessions
    - paragraph: "2"
    - img
    - img
    - paragraph: Active Tasks
    - paragraph: "2"
```

# Test source

```ts
  51  |       return;
  52  |     }
  53  | 
  54  |     // Tasks
  55  |     if (url.includes('/rest/v1/tasks')) {
  56  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  57  |         { id: 'task-1', user_id: 'mock-student-1', title: 'Submit updated resume PDF', description: 'Export resume as PDF and submit', status: 'pending', due_date: new Date(Date.now() + 3 * 86400000).toISOString(), priority: 'high', created_at: '2025-06-15T00:00:00Z', program_id: null, task_title: null, feedback: null, mentor_response: null },
  58  |         { id: 'task-2', user_id: 'mock-student-1', title: 'Read PM Interview Guide', description: 'Read chapters 1-3 of the guide', status: 'in_progress', due_date: new Date(Date.now() + 5 * 86400000).toISOString(), priority: 'medium', created_at: '2025-06-15T00:00:00Z', program_id: null, task_title: null, feedback: null, mentor_response: null },
  59  |       ]) });
  60  |       return;
  61  |     }
  62  | 
  63  |       // Sessions (attendance_status must be 'pending' for if to appear as upcoming)
  64  |     if (url.includes('/rest/v1/sessions')) {
  65  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  66  |         { id: 's1', student_id: 'mock-student-1', mentor_id: 'mentor-1', title: 'Introductory Call', description: 'First meeting to discuss goals', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), meeting_url: 'https://meet.google.com/abc-defg-hij', attendance_status: 'pending', status: 'scheduled', created_at: '2025-06-10T00:00:00Z', meeting_type: 'Google Meet' },
  67  |         { id: 's2', student_id: 'mock-student-1', mentor_id: 'mentor-1', title: 'Resume Review Session', description: 'Review resume draft together', start_time: new Date(Date.now() + 7 * 86400000).toISOString(), end_time: new Date(Date.now() + 7 * 86400000 + 3600000).toISOString(), meeting_url: 'https://meet.google.com/xyz-uvwx-yz', attendance_status: 'pending', status: 'scheduled', created_at: '2025-06-12T00:00:00Z', meeting_type: 'Google Meet' },
  68  |       ]) });
  69  |       return;
  70  |     }
  71  | 
  72  |     // Student progress
  73  |     if (url.includes('/rest/v1/student_progress')) {
  74  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  75  |         { user_id: 'mock-student-1', program_id: 'prog-1', started_at: '2025-06-01T00:00:00Z', completed_at: null, lessons: {} },
  76  |       ]) });
  77  |       return;
  78  |     }
  79  | 
  80  |     // Programs
  81  |     if (url.includes('/rest/v1/programs')) {
  82  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  83  |         { id: 'prog-1', title: 'Product Management Foundations', description: 'Learn the basics of product management', duration: '12 weeks', status: 'active', category: 'Career Development', difficulty: 'Beginner', progress: 0, student_count: null, created_at: '2025-01-01T00:00:00Z' },
  84  |       ]) });
  85  |       return;
  86  |     }
  87  | 
  88  |     // Events
  89  |     if (url.includes('/rest/v1/events')) {
  90  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  91  |         { id: 'event-1', title: 'Networking Mixer', description: 'Connect with industry professionals', date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], time: '18:00', location: 'Virtual', meeting_link: 'https://zoom.us/j/123', capacity: 50, attendees: [], category: 'Networking', status: 'published', created_at: '2025-06-01T00:00:00Z' },
  92  |       ]) });
  93  |       return;
  94  |     }
  95  | 
  96  |     // Event attendees
  97  |     if (url.includes('/rest/v1/event_attendees')) {
  98  |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  99  |       return;
  100 |     }
  101 | 
  102 |     // Resources
  103 |     if (url.includes('/rest/v1/resources')) {
  104 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
  105 |         { id: 'res-1', title: 'PM Interview Guide', url: 'https://example.com/pm-guide', category: 'Career Resources', is_pinned: true },
  106 |         { id: 'res-2', title: 'Resume Template', url: 'https://example.com/resume', category: 'Templates', is_pinned: false },
  107 |       ]) });
  108 |       return;
  109 |     }
  110 | 
  111 |     // Bookings
  112 |     if (url.includes('/rest/v1/bookings')) {
  113 |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  114 |       return;
  115 |     }
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
> 151 |       await expect(page.getByRole('link', { name: item })).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
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
  216 |     await page.getByRole('link', { name: 'Events' }).click();
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