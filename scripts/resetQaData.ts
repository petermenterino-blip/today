/**
 * Reset QA Data Script
 *
 * Run: npx tsx scripts/resetQaData.ts
 *
 * Resets the staging database to a clean state by truncating
 * all QA-related tables and re-running the seed.
 * Requires service_role key in environment.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TRUNCATE_TABLES = [
  'analytics_events',
  'student_timeline_events',
  'notifications',
  'messages',
  'conversation_participants',
  'conversations',
  'sessions',
  'tasks',
  'goal_milestones',
  'goals',
  'dashboard_layouts',
  'student_progress',
  'applications',
  'journals',
];

const QA_PROFILE_IDS = [
  '00000000-0000-0000-0000-000000000001', // mentor
  '00000000-0000-0000-0000-000000000002', // student1
  '00000000-0000-0000-0000-000000000003', // student2
];

async function resetQaData() {
  console.log('=== Resetting QA Data ===');

  // Truncate data tables (order matters for FK constraints)
  for (const table of TRUNCATE_TABLES) {
    const { error } = await supabase.rpc('truncate_table', { table_name: table });
    if (error && !error.message.includes('function does not exist')) {
      // Fallback: delete with service_role bypass
      const { error: delError } = await supabase
        .from(table)
        .delete()
        .in('user_id', QA_PROFILE_IDS);
      if (delError) {
        // Try with student_id column
        const { error: delError2 } = await supabase
          .from(table)
          .delete()
          .in('student_id', QA_PROFILE_IDS);
        if (delError2) {
          console.log(`  SKIP    ${table} (no QA records or no matching column)`);
        } else {
          console.log(`  DELETED ${table}`);
        }
      } else {
        console.log(`  DELETED ${table}`);
      }
    } else {
      console.log(`  TRUNCATED ${table}`);
    }
  }

  // Reset profiles to basic state
  for (const id of QA_PROFILE_IDS) {
    const { error } = await supabase
      .from('profiles')
      .update({
        mentor_id: null,
        program_id: null,
        application_status: 'approved',
        status: 'active',
        health_status: 'active',
        growth_score: 0,
        metrics: { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 },
      })
      .eq('id', id);

    if (error) {
      console.error(`  ERROR   resetting profile ${id}: ${error.message}`);
    } else {
      console.log(`  RESET   profile ${id}`);
    }
  }

  console.log('');
  console.log('Run the seed.sql against the database to restore demo data:');
  console.log('  psql $STAGING_DATABASE_URL -f supabase/seed/seed.sql');
  console.log('');
  console.log('=== Done ===');
}

resetQaData();
