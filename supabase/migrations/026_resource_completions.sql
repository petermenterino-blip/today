-- Resource completions tracking (student marks resource as complete)
create table if not exists public.resource_completions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  completed_at timestamptz not null default now(),
  unique(resource_id, user_id)
);

create index if not exists idx_resource_completions_resource on public.resource_completions(resource_id);
create index if not exists idx_resource_completions_user on public.resource_completions(user_id);

-- Recently viewed tracking
create table if not exists public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete cascade not null,
  viewed_at timestamptz not null default now(),
  unique(user_id, resource_id)
);

create index if not exists idx_recently_viewed_user on public.recently_viewed(user_id);
create index if not exists idx_recently_viewed_resource on public.recently_viewed(resource_id);

-- RLS
alter table if exists public.resource_completions enable row level security;
alter table if exists public.recently_viewed enable row level security;

drop policy if exists "Users manage own completions" on public.resource_completions;
create policy "Users manage own completions"
  on public.resource_completions for insert
  with check (user_id = auth.uid());

create policy "Users read own completions"
  on public.resource_completions for select
  using (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'mentor'));

create policy "Users delete own completions"
  on public.resource_completions for delete
  using (user_id = auth.uid());

drop policy if exists "Users manage recently viewed" on public.recently_viewed;
create policy "Users manage recently viewed"
  on public.recently_viewed for insert
  with check (user_id = auth.uid());

create policy "Users read recently viewed"
  on public.recently_viewed for select
  using (user_id = auth.uid());

create policy "Users update recently viewed"
  on public.recently_viewed for update
  using (user_id = auth.uid());

-- Add to realtime
alter publication supabase_realtime add table public.resource_completions;
alter publication supabase_realtime add table public.recently_viewed;

-- Resource completion trigger (log activity)
create or replace function public.log_resource_completion()
returns trigger as $$
begin
  insert into public.resource_activity (resource_id, user_id, action, details)
  values (new.resource_id, new.user_id, 'completed', jsonb_build_object('completed_at', new.completed_at));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_log_resource_completion on public.resource_completions;
create trigger trigger_log_resource_completion
  after insert on public.resource_completions
  for each row
  execute function public.log_resource_completion();

-- Add completion tracking to resources table
alter table if exists public.resources
  add column if not exists completions_count integer default 0;

-- Increment completions count trigger
create or replace function public.increment_resource_completions()
returns trigger as $$
begin
  update public.resources
  set completions_count = completions_count + 1
  where id = new.resource_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_increment_completions on public.resource_completions;
create trigger trigger_increment_completions
  after insert on public.resource_completions
  for each row
  execute function public.increment_resource_completions();

-- Function to upsert recently_viewed (uses auth.uid() to prevent cross-user manipulation)
create or replace function public.upsert_recently_viewed(p_resource_id uuid)
returns void as $$
begin
  insert into public.recently_viewed (user_id, resource_id, viewed_at)
  values (auth.uid(), p_resource_id, now())
  on conflict (user_id, resource_id)
  do update set viewed_at = now();
end;
$$ language plpgsql security definer set search_path = public;
