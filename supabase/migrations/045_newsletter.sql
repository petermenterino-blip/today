-- ============================================================
-- MIGRATION 045: NEWSLETTER SUBSCRIPTIONS
--
-- Creates a table for visitor newsletter signups so they
-- can be collected from the landing page footer.
-- ============================================================

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text default 'footer'
);

create unique index if not exists idx_newsletter_email on public.newsletter_subscriptions(email);

alter table public.newsletter_subscriptions enable row level security;

drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscriptions;
create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscriptions for insert
  with check (true);

drop policy if exists "Mentors can read newsletter subscriptions" on public.newsletter_subscriptions;
create policy "Mentors can read newsletter subscriptions"
  on public.newsletter_subscriptions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Anyone can update own subscription" on public.newsletter_subscriptions;
create policy "Anyone can update own subscription"
  on public.newsletter_subscriptions for update
  using (email = auth.email());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'newsletter_subscriptions'
  ) then
    alter publication supabase_realtime add table public.newsletter_subscriptions;
  end if;
end $$;
