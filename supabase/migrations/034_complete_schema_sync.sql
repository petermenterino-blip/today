-- ============================================================
-- COMPREHENSIVE SCHEMA SYNCHRONISATION
-- Creates all missing tables and columns that the frontend
-- queries.  This is the "database side" of the schema fix.
-- ============================================================

-- ════════════════════════════════════════════════════════════
--  1.  RESOURCES — expand the bare-bones table
-- ════════════════════════════════════════════════════════════
alter table public.resources
  add column if not exists description     text,
  add column if not exists file_type       text,
  add column if not exists file_size       bigint default 0,
  add column if not exists file_path       text,
  add column if not exists thumbnail_url   text,
  add column if not exists duration        text,
  add column if not exists source_type     text,
  add column if not exists external_url    text,
  add column if not exists tags            jsonb default '[]'::jsonb,
  add column if not exists program_ids     jsonb default '[]'::jsonb,
  add column if not exists student_ids     jsonb default '[]'::jsonb,
  add column if not exists status          text default 'active',
  add column if not exists visibility      text default 'visible',
  add column if not exists featured        boolean default false,
  add column if not exists is_archived     boolean default false,
  add column if not exists version         integer default 1,
  add column if not exists views_count     integer default 0,
  add column if not exists downloads_count integer default 0,
  add column if not exists favorites_count integer default 0,
  add column if not exists completions_count integer default 0,
  add column if not exists updated_at      timestamptz default now();

-- ════════════════════════════════════════════════════════════
--  2.  Missing resource-* tables
-- ════════════════════════════════════════════════════════════

create table if not exists public.resource_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,
  description  text,
  icon         text,
  color        text default '#6366f1',
  parent_id    uuid references public.resource_categories(id) on delete set null,
  sort_order   integer default 0,
  is_archived  boolean default false,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists public.resource_favorites (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  bookmarked  boolean default true,
  created_at  timestamptz default now(),
  unique(resource_id, user_id)
);

create table if not exists public.resource_comments (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.resource_comments(id) on delete set null,
  content     text not null,
  edited_at   timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);

create table if not exists public.resource_versions (
  id             uuid primary key default gen_random_uuid(),
  resource_id    uuid not null references public.resources(id) on delete cascade,
  version_number integer not null default 1,
  file_path      text,
  file_type      text,
  file_size      bigint default 0,
  change_notes   text,
  created_at     timestamptz default now()
);

create table if not exists public.resource_activity (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  details     jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.resource_completions (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(resource_id, user_id)
);

create table if not exists public.resource_downloads (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists public.resource_assignments (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  program_id  uuid references public.programs(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now(),
  unique(resource_id, student_id)
);

create table if not exists public.recently_viewed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  viewed_at   timestamptz default now(),
  unique(user_id, resource_id)
);

-- ════════════════════════════════════════════════════════════
--  3.  REVIEWS system
-- ════════════════════════════════════════════════════════════

create table if not exists public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.profiles(id) on delete cascade,
  mentor_id             uuid not null references public.profiles(id) on delete cascade,
  program_id            uuid references public.programs(id) on delete set null,
  title                 text not null,
  description           text,
  status                text not null default 'assigned',
  priority              text default 'medium',
  due_date              timestamptz,
  rating                integer,
  feedback              text,
  mentor_notes          text,
  mentor_response       text,
  student_response      text,
  tags                  jsonb default '[]'::jsonb,
  estimated_review_time integer,
  completion_percentage integer default 0,
  last_edited_at        timestamptz,
  last_edited_by        uuid references public.profiles(id) on delete set null,
  completed_at          timestamptz,
  source_type           text,
  source_id             text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  deleted_at            timestamptz
);

create table if not exists public.review_history (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status   text not null,
  comment     text,
  created_at  timestamptz default now()
);

-- ════════════════════════════════════════════════════════════
--  4.  RLS for new tables — permissive for authenticated users
--      (same pattern used by the existing app code)
-- ════════════════════════════════════════════════════════════

do $$ declare
  t text;
  tables text[] := array[
    'resource_categories','resource_favorites','resource_comments',
    'resource_versions','resource_activity','resource_completions',
    'resource_downloads','resource_assignments','recently_viewed',
    'reviews','review_history'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'Authenticated full access') then
      execute format(
        'create policy "Authenticated full access" on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
        t
      );
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════
--  5.  Resource / reviews realtime (ignore if already added)
-- ════════════════════════════════════════════════════════════

do $$ declare
  tbls text[] := array[
    'resource_categories','resource_favorites','resource_comments',
    'resource_versions','resource_activity','resource_completions',
    'resource_downloads','resource_assignments','recently_viewed',
    'reviews','review_history'
  ];
  t text;
begin
  foreach t in array tbls loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;
