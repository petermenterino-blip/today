-- ============================================================
-- MIGRATION 042: CONTACT SUBMISSIONS
--
-- Creates a table for website contact form submissions so they
-- can be viewed in the mentor dashboard alongside bookings.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. contact_submissions table
-- ════════════════════════════════════════════════════════════
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  discipline text,
  subject text,
  message text,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contact_submissions_status on public.contact_submissions(status);
create index if not exists idx_contact_submissions_created_at on public.contact_submissions(created_at);

-- ════════════════════════════════════════════════════════════
-- 2. RLS: anyone can insert, mentors can read/update
-- ════════════════════════════════════════════════════════════
alter table public.contact_submissions enable row level security;

drop policy if exists "Anyone can insert contact submissions" on public.contact_submissions;
create policy "Anyone can insert contact submissions"
  on public.contact_submissions for insert
  with check (true);

drop policy if exists "Mentors can read contact submissions" on public.contact_submissions;
create policy "Mentors can read contact submissions"
  on public.contact_submissions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can update contact submissions" on public.contact_submissions;
create policy "Mentors can update contact submissions"
  on public.contact_submissions for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- ════════════════════════════════════════════════════════════
-- 3. Add to realtime publication
-- ════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contact_submissions'
  ) then
    alter publication supabase_realtime add table public.contact_submissions;
  end if;
end $$;

-- ════════════════════════════════════════════════════════════
-- 4. Updated_at trigger
-- ════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_contact_submissions_updated_at'
  ) then
    create trigger set_contact_submissions_updated_at
      before update on public.contact_submissions
      for each row execute function public.handle_updated_at();
  end if;
end $$;
