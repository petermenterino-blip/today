/**
 * Seed Auth Users Script
 *
 * Run: npx tsx scripts/seedAuthUsers.ts
 *
 * Creates test authentication users for local development.
 * Uses Supabase Admin API (requires service_role key in .env).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwV8HzdpP2N_1MKsI'; // local default

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SEED_USERS = [
  {
    email: 'mentor@mentorino.com',
    password: 'password123',
    user_metadata: { name: 'Peter Mannarino', role: 'mentor' },
  },
  {
    email: 'student@mentorino.com',
    password: 'password123',
    user_metadata: { name: 'Alex Rivera', role: 'student' },
  },
  {
    email: 'admin@mentorino.com',
    password: 'password123',
    user_metadata: { name: 'Admin', role: 'admin' },
  },
];

async function seedAuthUsers() {
  console.log('Seeding auth users...');

  for (const user of SEED_USERS) {
    const { data: existingList } = await supabase.auth.admin.listUsers();
    const existing = existingList?.users?.find(u => u.email === user.email);
    if (existing) {
      console.log(`  Skipping ${user.email} (already exists)`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata,
    });

    if (error) {
      console.error(`  Error creating ${user.email}:`, error.message);
    } else {
      console.log(`  Created ${user.email} (${data.user.id})`);

      // Create profile entry
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: user.email,
        name: user.user_metadata.name,
        role: user.user_metadata.role,
      });

      if (profileError) {
        console.error(`  Error creating profile for ${user.email}:`, profileError.message);
      }
    }
  }

  console.log('Done.');
}

seedAuthUsers();
