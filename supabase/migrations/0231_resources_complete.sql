-- Resource Management System - Complete Schema
-- Part of Module 13 implementation

-- ========================
-- 1. ENHANCE RESOURCES TABLE
-- ========================
alter table if exists public.resources
  add column if not exists description text,
  add column if not exists file_type text,
  add column if not exists file_size bigint default 0,
  add column if not exists file_path text,
  add column if not exists thumbnail_url text,
  add column if not exists duration text,
  add column if not exists status text default 'active' check (status in ('active', 'archived', 'draft')),
  add column if not exists visibility text default 'visible' check (visibility in ('visible', 'hidden')),
  add column if not exists featured boolean default false,
  add column if not exists is_archived boolean default false,
  add column if not exists version integer default 1,
  add column if not exists downloads_count integer default 0,
  add column if not exists views_count integer default 0,
  add column if not exists favorites_count integer default 0,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists external_url text,
  add column if not exists source_type text check (source_type in ('upload', 'link', 'youtube', 'github', 'googledrive', 'notion', 'figma', 'canva', 'website')),
  add column if not exists tags text[] default '{}',
  add column if not exists program_ids uuid[] default '{}',
  add column if not exists student_ids uuid[] default '{}';

-- Fix the url column to be nullable (for uploaded files without external URL)
alter table if exists public.resources
  alter column url drop not null;

-- ========================
-- 2. RESOURCE CATEGORIES
-- ========================
create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  color text default '#6366f1',
  parent_id uuid references public.resource_categories(id) on delete set null,
  sort_order integer default 0,
  is_archived boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================
-- 3. RESOURCE-TAGS MAPPING
-- ========================
create table if not exists public.resource_tags (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(resource_id, tag)
);

create index if not exists idx_resource_tags_resource on public.resource_tags(resource_id);
create index if not exists idx_resource_tags_tag on public.resource_tags(tag);

-- ========================
-- 4. RESOURCE ASSIGNMENTS (student / program)
-- ========================
create table if not exists public.resource_assignments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  constraint at_least_one_target check (student_id is not null or program_id is not null)
);

create index if not exists idx_resource_assignments_resource on public.resource_assignments(resource_id);
create index if not exists idx_resource_assignments_student on public.resource_assignments(student_id);
create index if not exists idx_resource_assignments_program on public.resource_assignments(program_id);

-- ========================
-- 5. RESOURCE VIEWS
-- ========================
create table if not exists public.resource_views (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create index if not exists idx_resource_views_resource on public.resource_views(resource_id);
create index if not exists idx_resource_views_user on public.resource_views(user_id);

-- ========================
-- 6. RESOURCE DOWNLOADS
-- ========================
create table if not exists public.resource_downloads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  downloaded_at timestamptz not null default now(),
  ip_address text
);

create index if not exists idx_resource_downloads_resource on public.resource_downloads(resource_id);
create index if not exists idx_resource_downloads_user on public.resource_downloads(user_id);

-- ========================
-- 7. RESOURCE FAVORITES / BOOKMARKS
-- ========================
create table if not exists public.resource_favorites (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bookmarked boolean default false,
  created_at timestamptz not null default now(),
  unique(resource_id, user_id)
);

create index if not exists idx_resource_favorites_resource on public.resource_favorites(resource_id);
create index if not exists idx_resource_favorites_user on public.resource_favorites(user_id);

-- ========================
-- 8. RESOURCE COMMENTS
-- ========================
create table if not exists public.resource_comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.resource_comments(id) on delete cascade,
  content text not null,
  mentions uuid[] default '{}',
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_resource_comments_resource on public.resource_comments(resource_id);

-- ========================
-- 9. RESOURCE VERSIONS
-- ========================
create table if not exists public.resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  version_number integer not null,
  title text,
  description text,
  file_path text,
  file_type text,
  file_size bigint default 0,
  external_url text,
  created_by uuid references public.profiles(id) on delete set null,
  change_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_resource_versions_resource on public.resource_versions(resource_id);

-- ========================
-- 10. RESOURCE ACTIVITY LOG
-- ========================
create table if not exists public.resource_activity (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'created', 'updated', 'deleted', 'restored', 'archived',
    'viewed', 'downloaded', 'favorited', 'unfavorited',
    'assigned', 'unassigned', 'commented', 'version_created',
    'featured', 'unfeatured', 'pinned', 'unpinned',
    'completed', 'shared', 'link_copied'
  )),
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_resource_activity_resource on public.resource_activity(resource_id);
create index if not exists idx_resource_activity_user on public.resource_activity(user_id);
create index if not exists idx_resource_activity_action on public.resource_activity(action);

-- ========================
-- 11. UPDATED RLS POLICIES
-- ========================

-- Resources: mentors can update
drop policy if exists "Mentors can update resources" on public.resources;
create policy "Mentors can update resources"
  on public.resources for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resources: mentors can delete (soft or hard)
drop policy if exists "Mentors can delete resources" on public.resources;
create policy "Mentors can delete resources"
  on public.resources for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource categories: authenticated read
drop policy if exists "Anyone can read resource categories" on public.resource_categories;
create policy "Anyone can read resource categories"
  on public.resource_categories for select
  using (auth.role() = 'authenticated');

-- Resource categories: mentors manage
drop policy if exists "Mentors manage resource categories" on public.resource_categories;
create policy "Mentors manage resource categories"
  on public.resource_categories for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors update resource categories" on public.resource_categories;
create policy "Mentors update resource categories"
  on public.resource_categories for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors delete resource categories" on public.resource_categories;
create policy "Mentors delete resource categories"
  on public.resource_categories for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource tags: authenticated read
drop policy if exists "Anyone can read resource tags" on public.resource_tags;
create policy "Anyone can read resource tags"
  on public.resource_tags for select
  using (auth.role() = 'authenticated');

-- Resource tags: mentors manage
drop policy if exists "Mentors manage resource tags" on public.resource_tags;
create policy "Mentors manage resource tags"
  on public.resource_tags for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource assignments: authenticated can read their own
drop policy if exists "Users read own assignments" on public.resource_assignments;
create policy "Users read own assignments"
  on public.resource_assignments for select
  using (
    student_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors manage assignments" on public.resource_assignments;
create policy "Mentors manage assignments"
  on public.resource_assignments for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors delete assignments" on public.resource_assignments;
create policy "Mentors delete assignments"
  on public.resource_assignments for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource views: authenticated can insert (tracking)
drop policy if exists "Users can insert views" on public.resource_views;
create policy "Users can insert views"
  on public.resource_views for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can read views" on public.resource_views;
create policy "Users can read views"
  on public.resource_views for select
  using (auth.role() = 'authenticated');

-- Resource downloads: authenticated can insert
drop policy if exists "Users can insert downloads" on public.resource_downloads;
create policy "Users can insert downloads"
  on public.resource_downloads for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can read downloads" on public.resource_downloads;
create policy "Users can read downloads"
  on public.resource_downloads for select
  using (auth.role() = 'authenticated');

-- Resource favorites: users manage own
drop policy if exists "Users manage own favorites" on public.resource_favorites;
create policy "Users manage own favorites"
  on public.resource_favorites for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own favorites" on public.resource_favorites;
create policy "Users update own favorites"
  on public.resource_favorites for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own favorites" on public.resource_favorites;
create policy "Users delete own favorites"
  on public.resource_favorites for delete
  using (user_id = auth.uid());

drop policy if exists "Users read own favorites" on public.resource_favorites;
create policy "Users read own favorites"
  on public.resource_favorites for select
  using (auth.role() = 'authenticated');

-- Resource comments: authenticated read
drop policy if exists "Users read comments" on public.resource_comments;
create policy "Users read comments"
  on public.resource_comments for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users create comments" on public.resource_comments;
create policy "Users create comments"
  on public.resource_comments for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own comments" on public.resource_comments;
create policy "Users update own comments"
  on public.resource_comments for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own comments" on public.resource_comments;
create policy "Users delete own comments"
  on public.resource_comments for delete
  using (user_id = auth.uid());

-- Resource versions: authenticated read
drop policy if exists "Users read versions" on public.resource_versions;
create policy "Users read versions"
  on public.resource_versions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors create versions" on public.resource_versions;
create policy "Mentors create versions"
  on public.resource_versions for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Resource activity: authenticated read
drop policy if exists "Users read activity" on public.resource_activity;
create policy "Users read activity"
  on public.resource_activity for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users insert activity" on public.resource_activity;
create policy "Users insert activity"
  on public.resource_activity for insert
  with check (auth.role() = 'authenticated');

-- ========================
-- 12. TRIGGER: update updated_at
-- ========================
create or replace function public.update_resource_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_resource_timestamp on public.resources;
create trigger trigger_update_resource_timestamp
  before update on public.resources
  for each row
  execute function public.update_resource_timestamp();

-- ========================
-- 13. AUTO-CREATE ACTIVITY ON INSERT
-- ========================
create or replace function public.log_resource_activity()
returns trigger as $$
begin
  insert into public.resource_activity (resource_id, user_id, action, details)
  values (
    new.id,
    coalesce(new.created_by, auth.uid()),
    'created',
    jsonb_build_object('title', new.title)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_log_resource_activity on public.resources;
create trigger trigger_log_resource_activity
  after insert on public.resources
  for each row
  execute function public.log_resource_activity();

-- ========================
-- 14. INCREMENT DOWNLOADS COUNT
-- ========================
create or replace function public.increment_resource_downloads()
returns trigger as $$
begin
  update public.resources
  set downloads_count = downloads_count + 1
  where id = new.resource_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_increment_downloads on public.resource_downloads;
create trigger trigger_increment_downloads
  after insert on public.resource_downloads
  for each row
  execute function public.increment_resource_downloads();

-- ========================
-- 15. INCREMENT VIEWS COUNT
-- ========================
create or replace function public.increment_resource_views()
returns trigger as $$
begin
  update public.resources
  set views_count = views_count + 1
  where id = new.resource_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_increment_views on public.resource_views;
create trigger trigger_increment_views
  after insert on public.resource_views
  for each row
  execute function public.increment_resource_views();

-- ========================
-- 16. ADD RESOURCES TO REALTIME PUBLICATION
-- ========================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resources') then
    alter publication supabase_realtime add table public.resources;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_categories') then
    alter publication supabase_realtime add table public.resource_categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_tags') then
    alter publication supabase_realtime add table public.resource_tags;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_assignments') then
    alter publication supabase_realtime add table public.resource_assignments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_favorites') then
    alter publication supabase_realtime add table public.resource_favorites;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_comments') then
    alter publication supabase_realtime add table public.resource_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_activity') then
    alter publication supabase_realtime add table public.resource_activity;
  end if;
end $$;

-- ========================
-- 17. SEED DEFAULT CATEGORIES
-- ========================
insert into public.resource_categories (name, slug, description, icon, color, sort_order) values
  ('Interview Prep', 'interview-prep', 'Interview preparation materials and guides', 'Briefcase', '#ef4444', 1),
  ('Resume', 'resume', 'Resume templates and tips', 'FileText', '#f59e0b', 2),
  ('System Design', 'system-design', 'System design resources and case studies', 'Server', '#8b5cf6', 3),
  ('Career', 'career', 'Career development resources', 'TrendingUp', '#10b981', 4),
  ('Programming', 'programming', 'Programming tutorials and references', 'Code', '#3b82f6', 5),
  ('Frontend', 'frontend', 'Frontend development resources', 'Monitor', '#06b6d4', 6),
  ('Backend', 'backend', 'Backend development resources', 'Database', '#ec4899', 7),
  ('AI', 'ai', 'Artificial Intelligence resources', 'Brain', '#a855f7', 8),
  ('Machine Learning', 'machine-learning', 'Machine Learning resources', 'Cpu', '#f97316', 9),
  ('Assignments', 'assignments', 'Course assignments and projects', 'ClipboardList', '#14b8a6', 10),
  ('Projects', 'projects', 'Project templates and guides', 'FolderKanban', '#6366f1', 11),
  ('Templates', 'templates', 'Reusable templates', 'Layout', '#8b5cf6', 12),
  ('Guides', 'guides', 'Step-by-step guides', 'BookOpen', '#0ea5e9', 13),
  ('Reference', 'reference', 'Quick reference materials', 'Bookmark', '#84cc16', 14),
  ('Mock Interviews', 'mock-interviews', 'Mock interview practice', 'Mic', '#e11d48', 15),
  ('Soft Skills', 'soft-skills', 'Soft skills development', 'Heart', '#f43f5e', 16),
  ('Career Roadmap', 'career-roadmap', 'Career roadmap guides', 'Map', '#22c55e', 17),
  ('Certification', 'certification', 'Certification prep materials', 'Award', '#eab308', 18)
on conflict (name) do nothing;

-- Enable RLS on all new tables
alter table if exists public.resource_categories enable row level security;
alter table if exists public.resource_tags enable row level security;
alter table if exists public.resource_assignments enable row level security;
alter table if exists public.resource_views enable row level security;
alter table if exists public.resource_downloads enable row level security;
alter table if exists public.resource_favorites enable row level security;
alter table if exists public.resource_comments enable row level security;
alter table if exists public.resource_versions enable row level security;
alter table if exists public.resource_activity enable row level security;

-- Update storage bucket for mentor-resources to allow more file types
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json'
],
file_size_limit = 104857600
where id = 'mentor-resources';
