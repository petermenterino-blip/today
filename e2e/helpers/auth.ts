import { Page } from '@playwright/test';

export const MOCK_USER = {
  id: 'mock-student-1',
  email: 'student@mentorino.com',
  name: 'Test Student',
  role: 'student' as const,
  application_status: 'approved',
  created_at: '2025-01-01T00:00:00Z',
  profile: {
    id: 'mock-student-1',
    email: 'student@mentorino.com',
    first_name: 'Test',
    last_name: 'Student',
    name: 'Test Student',
    avatar_url: '',
    role: 'student' as const,
    created_at: '2025-01-01T00:00:00Z',
  },
};

const MOCK_AUTH_MODULE = `
  const mockUser = ${JSON.stringify(MOCK_USER)};

  export const authService = {
    async getCurrentUser() {
      return { data: { ...mockUser }, error: null };
    },
    async signIn() {
      return { data: { ...mockUser }, error: null };
    },
    async signUp() {
      return { data: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role, created_at: mockUser.created_at }, error: null };
    },
    async signOut() {
      return { data: undefined, error: null };
    },
    onAuthStateChange() {
      return null;
    },
  };
`;

/**
 * Sets up mock authentication by intercepting the authService module.
 * Call this in `test.beforeEach`.
 */
export async function setupAuthMock(page: Page) {
  // Intercept authService module and replace with mock
  await page.route((url) => {
    const u = typeof url === 'string' ? url : url.toString();
    return u.includes('/src/services/authService.ts');
  }, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: MOCK_AUTH_MODULE,
    });
  });
}

/**
 * Sets up mock Supabase REST API responses.
 * Call this in `test.beforeEach` after setting up specific endpoint mocks.
 */
export async function setupSupabaseMocks(page: Page, customMocks?: (url: string, route: any) => boolean | Promise<boolean>) {
  await page.route((url) => url.hostname.includes('supabase.co'), async (route) => {
    const url = route.request().url();

    if (customMocks) {
      const handled = await customMocks(url, route);
      if (handled) return;
    }

    // Default mock for auth endpoints
    if (url.includes('/auth/v1/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-student-1', email: 'student@mentorino.com', role: 'authenticated' }),
      });
      return;
    }

    // Default mock for profiles
    if (url.includes('/rest/v1/profiles')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_USER.profile]),
      });
      return;
    }

    // Default: empty array for all other endpoints
    if (url.includes('/rest/v1/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }

    // Let non-REST requests through (e.g. real-time, storage)
    await route.continue();
  });
}

/**
 * Suppresses database seeding by setting seed version in localStorage.
 */
export async function suppressSeed(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mentorino_seed_version', 'v4');
  });
}
