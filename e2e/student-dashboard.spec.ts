import { test, expect, Page } from '@playwright/test';
import { setupAuthMock, suppressSeed } from './helpers/auth';

async function setupStudentPage(page: Page) {
  await suppressSeed(page);
  await setupAuthMock(page);

  // Mock all Supabase API endpoints with student dashboard data
  await page.route((url) => url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/'), async (route) => {
    const url = route.request().url();

    // Auth endpoints
    if (url.includes('/auth/v1/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'mock-student-1', email: 'student@mentorino.com', role: 'authenticated' }) });
      return;
    }

    // Profile endpoint
    if (url.includes('/rest/v1/profiles')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'mock-student-1', email: 'student@mentorino.com', first_name: 'Test', last_name: 'Student', name: 'Test Student', role: 'student', application_status: 'approved', created_at: '2025-01-01T00:00:00Z' }]) });
      return;
    }

    // Goals
    if (url.includes('/rest/v1/goals')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'goal-1', student_id: 'mock-student-1', title: 'Complete Resume', description: 'Update resume', progress_percentage: 100, status: 'completed', target_date: null, notes: null, created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-15T00:00:00Z' },
        { id: 'goal-2', student_id: 'mock-student-1', title: 'Conduct Informational Interviews', description: 'Reach out to PMs in target industries', progress_percentage: 40, status: 'in_progress', target_date: '2025-07-15T00:00:00Z', notes: 'Contact at least 5 PMs', created_at: '2025-06-05T00:00:00Z', updated_at: '2025-06-18T00:00:00Z' },
      ]) });
      return;
    }

    // Goal milestones (joined with goals)
    if (url.includes('/rest/v1/goal_milestones')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'gm-1', goal_id: 'goal-1', title: 'Draft resume', completed: true, created_at: '2025-06-01T00:00:00Z' },
        { id: 'gm-2', goal_id: 'goal-1', title: 'Review with mentor', completed: false, created_at: '2025-06-05T00:00:00Z' },
        { id: 'gm-3', goal_id: 'goal-2', title: 'Identify target companies', completed: true, created_at: '2025-06-05T00:00:00Z' },
        { id: 'gm-4', goal_id: 'goal-2', title: 'Prepare outreach message', completed: false, created_at: '2025-06-10T00:00:00Z' },
        { id: 'gm-5', goal_id: 'goal-2', title: 'Send first 5 messages', completed: false, created_at: '2025-06-15T00:00:00Z' },
      ]) });
      return;
    }

    // Journals
    if (url.includes('/rest/v1/journal') || url.includes('/rest/v1/journals')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'journal-1', student_id: 'mock-student-1', title: 'Daily Reflection', content: 'Today was very productive. I completed my resume draft and scheduled a meeting with my mentor.', type: 'daily', mood: 'good', wins: ['Completed resume draft'], challenges: ['Need to research more companies'], mentor_comments: null, reviewed_by_mentor: false, created_at: '2025-06-17T00:00:00Z', updated_at: '2025-06-17T00:00:00Z' },
        { id: 'journal-2', student_id: 'mock-student-1', title: 'Weekly Reflection', content: 'Good week overall. Made progress on goals.', type: 'weekly', mood: 'great', wins: ['Finished all tasks'], challenges: ['Time management'], mentor_comments: null, reviewed_by_mentor: false, created_at: '2025-06-14T00:00:00Z', updated_at: '2025-06-14T00:00:00Z' },
      ]) });
      return;
    }

    // Tasks
    if (url.includes('/rest/v1/tasks')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'task-1', student_id: 'mock-student-1', title: 'Submit updated resume PDF', description: 'Export resume as PDF and submit', status: 'pending', due_date: new Date(Date.now() + 3 * 86400000).toISOString(), priority: 'high', created_at: '2025-06-15T00:00:00Z', program_id: null, task_title: null, feedback: null, mentor_response: null },
        { id: 'task-2', student_id: 'mock-student-1', title: 'Read PM Interview Guide', description: 'Read chapters 1-3 of the guide', status: 'in_progress', due_date: new Date(Date.now() + 5 * 86400000).toISOString(), priority: 'medium', created_at: '2025-06-15T00:00:00Z', program_id: null, task_title: null, feedback: null, mentor_response: null },
      ]) });
      return;
    }

      // Sessions (attendance_status must be 'pending' for if to appear as upcoming)
    if (url.includes('/rest/v1/sessions')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 's1', student_id: 'mock-student-1', mentor_id: 'mentor-1', title: 'Introductory Call', description: 'First meeting to discuss goals', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), meeting_url: 'https://meet.google.com/abc-defg-hij', attendance_status: 'pending', status: 'scheduled', created_at: '2025-06-10T00:00:00Z', meeting_type: 'Google Meet' },
        { id: 's2', student_id: 'mock-student-1', mentor_id: 'mentor-1', title: 'Resume Review Session', description: 'Review resume draft together', start_time: new Date(Date.now() + 7 * 86400000).toISOString(), end_time: new Date(Date.now() + 7 * 86400000 + 3600000).toISOString(), meeting_url: 'https://meet.google.com/xyz-uvwx-yz', attendance_status: 'pending', status: 'scheduled', created_at: '2025-06-12T00:00:00Z', meeting_type: 'Google Meet' },
      ]) });
      return;
    }

    // Student progress
    if (url.includes('/rest/v1/student_progress')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { user_id: 'mock-student-1', program_id: 'prog-1', started_at: '2025-06-01T00:00:00Z', completed_at: null, lessons: {} },
      ]) });
      return;
    }

    // Programs
    if (url.includes('/rest/v1/programs')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'prog-1', title: 'Product Management Foundations', description: 'Learn the basics of product management', duration: '12 weeks', status: 'active', category: 'Career Development', difficulty: 'Beginner', progress: 0, student_count: null, created_at: '2025-01-01T00:00:00Z' },
      ]) });
      return;
    }

    // Events
    if (url.includes('/rest/v1/events')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'event-1', title: 'Networking Mixer', description: 'Connect with industry professionals', date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], time: '18:00', location: 'Virtual', meeting_link: 'https://zoom.us/j/123', capacity: 50, attendees: [], category: 'Networking', status: 'published', created_at: '2025-06-01T00:00:00Z' },
      ]) });
      return;
    }

    // Event attendees
    if (url.includes('/rest/v1/event_attendees')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }

    // Resources
    if (url.includes('/rest/v1/resources')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'res-1', title: 'PM Interview Guide', url: 'https://example.com/pm-guide', category: 'Career Resources', is_pinned: true },
        { id: 'res-2', title: 'Resume Template', url: 'https://example.com/resume', category: 'Templates', is_pinned: false },
      ]) });
      return;
    }

    // Bookings
    if (url.includes('/rest/v1/bookings')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }

    // Student timeline
    if (url.includes('/rest/v1/student_timeline_events')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'ste-1', student_id: 'mock-student-1', type: 'goal_completed', title: 'Completed Resume Goal', description: 'Successfully completed the Complete Resume goal', timestamp: '2025-06-15T00:00:00Z' },
      ]) });
      return;
    }

    // Catch-all for other REST endpoints
    if (url.includes('/rest/v1/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }

    await route.continue();
  });

  await page.goto('/#/student');
}

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupStudentPage(page);
  });

  test('redirects to student dashboard when authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/#\/student/, { timeout: 15000 });
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
  });

  test('shows sidebar with student navigation links', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    const navItems = ['Overview', 'Programs', 'Journal', 'Goals', 'Tasks', 'Sessions', 'Messages', 'Events'];
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('navigates to Goals page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Goals' }).click();
    await expect(page).toHaveURL(/#\/student\/goals/);
    await expect(page.getByRole('heading', { name: 'Your Goals' })).toBeVisible();
  });

  test('navigates to Tasks page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL(/#\/student\/tasks/);
    await expect(page.getByRole('heading', { name: 'Active Tasks' })).toBeVisible();
  });

  test('navigates to Journal page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Journal' }).click();
    await expect(page).toHaveURL(/#\/student\/journal/);
    await expect(page.getByRole('heading', { name: 'Your Journal' })).toBeVisible();
  });

  test('navigates to Sessions page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Sessions' }).click();
    await expect(page).toHaveURL(/#\/student\/sessions/);
  });

  test('shows goals list with progress', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Goals' }).click();
    await expect(page).toHaveURL(/#\/student\/goals/);
    await expect(page.getByText('Complete Resume')).toBeVisible();
    await expect(page.getByText('Conduct Informational Interviews')).toBeVisible();
  });

  test('shows journal entries on Journal page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Journal' }).click();
    await expect(page).toHaveURL(/#\/student\/journal/);
    await expect(page.getByText(/daily Reflection/i)).toBeVisible();
    await expect(page.getByText(/weekly Reflection/i)).toBeVisible();
    await expect(page.getByText(/Today was very productive/i)).toBeVisible();
  });

  test('shows upcoming sessions with meeting links', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Sessions' }).click();
    await expect(page).toHaveURL(/#\/student\/sessions/);
    await expect(page.getByText('Introductory Call')).toBeVisible();
    await expect(page.getByText('Resume Review Session')).toBeVisible();
  });

  test('shows tasks list with status', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL(/#\/student\/tasks/);
    await expect(page.getByText('Submit updated resume PDF')).toBeVisible();
  });

  test('navigates to Events page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Events' }).click();
    await expect(page).toHaveURL(/#\/student\/events/);
  });

  test('navigates to Programs page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Programs' }).click();
    await expect(page).toHaveURL(/#\/student\/programs/);
  });

  test('navigates back to overview from sub-page', async ({ page }) => {
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Goals' }).click();
    await expect(page).toHaveURL(/#\/student\/goals/);
    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/#\/student\/?$/);
  });
});
