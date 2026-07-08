-- Add curriculum JSONB column to programs for storing module/lesson structure
alter table public.programs add column if not exists curriculum jsonb default '[]'::jsonb;
