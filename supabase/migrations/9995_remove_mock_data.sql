-- Migration: Remove mock/seed data that may have been injected by seedData.ts
-- Only targets records with @example.com emails (fake seed data, not real users)

BEGIN;

-- Clean up records referencing mock student profiles
DELETE FROM goals
WHERE student_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@example.com'
);

DELETE FROM tasks
WHERE student_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@example.com'
)
   OR mentor_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@example.com'
);

DELETE FROM notifications
WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@example.com'
);

DELETE FROM student_progress
WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@example.com'
);

DELETE FROM dashboard_layouts
WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@example.com'
);

DELETE FROM profiles
WHERE email LIKE '%@example.com';

COMMIT;
