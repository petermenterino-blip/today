-- Gallery Module: production-ready gallery_items table + activity log + storage RLS fix

-- 1. Gallery items table
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Careers' check (category in ('Careers', 'Academic', 'Ceremonies', 'Virtual')),
  event_date text not null default '',
  location text not null default '',
  image_url text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  visibility text not null default 'published' check (visibility in ('published', 'draft', 'archived')),
  featured boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gallery_items_visibility on public.gallery_items(visibility);
create index if not exists idx_gallery_items_category on public.gallery_items(category);
create index if not exists idx_gallery_items_featured on public.gallery_items(featured);
create index if not exists idx_gallery_items_created_at on public.gallery_items(created_at desc);

-- 2. Gallery activity log
create table if not exists public.gallery_activity_log (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.gallery_items(id) on delete cascade,
  action text not null,
  user_id uuid references public.profiles(id) on delete set null,
  changes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_activity_log_gallery on public.gallery_activity_log(gallery_id);
create index if not exists idx_gallery_activity_log_created on public.gallery_activity_log(created_at desc);

-- 3. Auto-update updated_at
create or replace function public.update_gallery_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_gallery_items_updated_at on public.gallery_items;
create trigger trigger_gallery_items_updated_at
  before update on public.gallery_items
  for each row
  execute function public.update_gallery_items_updated_at();

-- 4. Increment view count
create or replace function public.increment_gallery_view_count(p_id uuid)
returns void as $$
begin
  update public.gallery_items
  set view_count = view_count + 1
  where id = p_id;
end;
$$ language plpgsql security definer;

-- 5. Activity log trigger
create or replace function public.log_gallery_activity()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (new.id, 'created', new.created_by, jsonb_build_object('title', new.title));
  elsif tg_op = 'UPDATE' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (new.id, 'updated', auth.uid(), jsonb_build_object('diff', case
      when old.title <> new.title then jsonb_build_object('title', jsonb_build_array(old.title, new.title))
      else '{}'::jsonb
    end));
  elsif tg_op = 'DELETE' then
    insert into public.gallery_activity_log (gallery_id, action, user_id, changes)
    values (old.id, 'deleted', auth.uid(), jsonb_build_object('title', old.title));
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_gallery_activity on public.gallery_items;
create trigger trigger_gallery_activity
  after insert or update or delete on public.gallery_items
  for each row
  execute function public.log_gallery_activity();

-- 6. RLS
alter table if exists public.gallery_items enable row level security;
alter table if exists public.gallery_activity_log enable row level security;

-- Public can read published items
drop policy if exists "Public read published gallery" on public.gallery_items;
create policy "Public read published gallery"
  on public.gallery_items for select
  using (visibility = 'published');

-- Authenticated users (mentors) can read all
drop policy if exists "Authenticated read all gallery" on public.gallery_items;
create policy "Authenticated read all gallery"
  on public.gallery_items for select
  to authenticated
  using (true);

-- Mentors can insert
drop policy if exists "Mentors insert gallery" on public.gallery_items;
create policy "Mentors insert gallery"
  on public.gallery_items for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Mentors can update
drop policy if exists "Mentors update gallery" on public.gallery_items;
create policy "Mentors update gallery"
  on public.gallery_items for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Mentors can delete
drop policy if exists "Mentors delete gallery" on public.gallery_items;
create policy "Mentors delete gallery"
  on public.gallery_items for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- Activity log: mentors read all
drop policy if exists "Mentors read activity log" on public.gallery_activity_log;
create policy "Mentors read activity log"
  on public.gallery_activity_log for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 7. Add UPDATE RLS policy for gallery-images storage bucket (missing from 014_storage.sql)
drop policy if exists "gallery_mentor_update" on storage.objects;
create policy "gallery_mentor_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gallery-images' and exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- 8. Add to realtime publication
alter publication supabase_realtime add table public.gallery_items;
