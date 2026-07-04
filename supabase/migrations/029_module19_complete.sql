-- Module 19: Settings, Social Links, Website Settings

-- 1. Social Links table
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_links_platform on public.social_links(platform);
create index if not exists idx_social_links_created_by on public.social_links(created_by);

alter table if exists public.social_links enable row level security;

drop policy if exists "Public read social links" on public.social_links;
create policy "Public read social links"
  on public.social_links for select
  to public
  using (true);

drop policy if exists "Mentors manage social links" on public.social_links;
create policy "Mentors manage social links"
  on public.social_links for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 2. Website Settings table
create table if not exists public.website_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Mentorino',
  tagline text not null default 'Clarity in career, schooling, and life.',
  footer_text text not null default 'We build the trajectory you were meant to follow.',
  copyright text not null default '© 2026 MEntorino ALL RIGHTS RESERVED',
  contact_email text not null default '',
  contact_phone text not null default '',
  address text not null default '',
  logo_url text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.website_settings enable row level security;

drop policy if exists "Public read website settings" on public.website_settings;
create policy "Public read website settings"
  on public.website_settings for select
  to public
  using (true);

drop policy if exists "Mentors manage website settings" on public.website_settings;
create policy "Mentors manage website settings"
  on public.website_settings for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 3. Auto-update triggers
create or replace function public.update_social_links_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_social_links_updated_at on public.social_links;
create trigger trigger_social_links_updated_at
  before update on public.social_links
  for each row
  execute function public.update_social_links_updated_at();

create or replace function public.update_website_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_website_settings_updated_at on public.website_settings;
create trigger trigger_website_settings_updated_at
  before update on public.website_settings
  for each row
  execute function public.update_social_links_updated_at();

-- 4. Seed default website settings
insert into public.website_settings (site_name, tagline, footer_text, copyright)
values ('Mentorino', 'Clarity in career, schooling, and life.', 'We build the trajectory you were meant to follow.', '© 2026 MEntorino ALL RIGHTS RESERVED')
on conflict do nothing;

-- 5. Seed default social links
insert into public.social_links (platform, url, enabled, sort_order) values
  ('Instagram', '', true, 1),
  ('Twitter', '', true, 2),
  ('Linkedin', '', true, 3),
  ('Youtube', '', true, 4),
  ('Facebook', '', false, 5),
  ('TikTok', '', false, 6),
  ('GitHub', '', false, 7),
  ('Medium', '', false, 8),
  ('Website', '', false, 9),
  ('Behance', '', false, 10)
on conflict do nothing;

-- 6. Add to realtime publication
alter publication supabase_realtime add table public.social_links;
alter publication supabase_realtime add table public.website_settings;

-- 7. Increase profile-avatars bucket limit to 5MB to match client expectations
update storage.buckets
set file_size_limit = 5242880
where id = 'profile-avatars';
