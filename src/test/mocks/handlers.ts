import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@mentorino.com',
        role: 'authenticated',
      },
    });
  }),

  http.get('https://*.supabase.co/rest/v1/profiles', () => {
    return HttpResponse.json([
      {
        id: 'mock-user-id',
        email: 'test@mentorino.com',
        role: 'student',
        full_name: 'Test User',
      },
    ]);
  }),

  http.post('https://*.supabase.co/auth/v1/signup', () => {
    return HttpResponse.json({
      id: 'new-mock-user-id',
      email: 'newuser@mentorino.com',
    });
  }),
];
