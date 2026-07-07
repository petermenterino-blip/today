/**
 * Seed Auth Users Script
 *
 * Run: npx tsx scripts/seedAuthUsers.ts
 *
 * Creates QA authentication users for staging environment.
 * Uses Supabase Admin API (requires service_role key in .env.staging).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const STAGING_MENTOR_PASSWORD = process.env.STAGING_MENTOR_PASSWORD;
const STAGING_STUDENT1_PASSWORD = process.env.STAGING_STUDENT1_PASSWORD;
const STAGING_STUDENT2_PASSWORD = process.env.STAGING_STUDENT2_PASSWORD;
if (!STAGING_MENTOR_PASSWORD || !STAGING_STUDENT1_PASSWORD || !STAGING_STUDENT2_PASSWORD) {
  console.error('FATAL: STAGING_MENTOR_PASSWORD, STAGING_STUDENT1_PASSWORD, and STAGING_STUDENT2_PASSWORD environment variables are required');
  process.exit(1);
}

const QA_USERS = [
  {
    email: 'mentor.qa@mentorino.test',
    password: STAGING_MENTOR_PASSWORD,
    user_metadata: { name: 'QA Mentor', role: 'mentor' },
  },
  {
    email: 'student1.qa@mentorino.test',
    password: STAGING_STUDENT1_PASSWORD,
    user_metadata: { name: 'QA Student One', role: 'student' },
  },
  {
    email: 'student2.qa@mentorino.test',
    password: STAGING_STUDENT2_PASSWORD,
    user_metadata: { name: 'QA Student Two', role: 'student' },
  },
];

async function seedAuthUsers() {
  console.log('=== Seeding QA Auth Users ===');

  for (const user of QA_USERS) {
    const { data: existingList } = await supabase.auth.admin.listUsers();
    const existingUsers = existingList?.users ?? [];
    const existing = existingUsers.find((u: any) => u?.email === user.email);
    if (existing) {
      console.log(`  EXISTS  ${user.email}`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata,
    });

    if (error) {
      console.error(`  ERROR   ${user.email}: ${error.message}`);
    } else {
      console.log(`  CREATED ${user.email} (${data.user.id})`);

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: user.email,
        name: user.user_metadata.name,
        role: user.user_metadata.role,
      });

      if (profileError) {
        console.error(`  ERROR   profile for ${user.email}: ${profileError.message}`);
      }
    }
  }

  console.log('=== Done ===');
}

seedAuthUsers();
