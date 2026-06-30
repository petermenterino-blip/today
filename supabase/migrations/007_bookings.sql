-- Bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  user_name text,
  date text,
  time text,
  type text,
  status text not null default 'upcoming' check (status in ('confirmed', 'cancelled', 'upcoming', 'completed')),
  meeting_link text,
  notes text,
  attendance text check (attendance in ('present', 'absent', 'excused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_bookings_status on public.bookings(status);
