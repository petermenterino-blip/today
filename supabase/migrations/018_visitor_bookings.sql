-- Visitor bookings table (no auth required)
create table if not exists public.visitor_bookings (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text,
  call_type text not null check (call_type in ('intro', 'rapid')),
  date text not null,
  time text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visitor_bookings_date on public.visitor_bookings(date);
create index if not exists idx_visitor_bookings_status on public.visitor_bookings(status);

-- RLS: anyone can insert
alter table public.visitor_bookings enable row level security;

drop policy if exists "Anyone can insert visitor bookings" on public.visitor_bookings;
create policy "Anyone can insert visitor bookings"
  on public.visitor_bookings for insert
  with check (true);

-- Mentors can read all visitor bookings
drop policy if exists "Mentors can read visitor bookings" on public.visitor_bookings;
create policy "Mentors can read visitor bookings"
  on public.visitor_bookings for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Mentors can update visitor bookings
drop policy if exists "Mentors can update visitor bookings" on public.visitor_bookings;
create policy "Mentors can update visitor bookings"
  on public.visitor_bookings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );
