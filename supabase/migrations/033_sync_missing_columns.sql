-- Sync columns that exist in TypeScript but are missing from DB

-- ── Events: add columns used by useEvents() ──
alter table if exists public.events add column if not exists event_type text;
alter table if exists public.events add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table if exists public.events add column if not exists meeting_platform text;
alter table if exists public.events add column if not exists allow_registration_approval boolean default false;
alter table if exists public.events add column if not exists notes text;

-- ── Bookings: add mentor_id column ──
alter table if exists public.bookings add column if not exists mentor_id uuid references public.profiles(id) on delete set null;

-- ── Also ensure bookings has updated_at ──
alter table if exists public.bookings add column if not exists updated_at timestamptz default now();
