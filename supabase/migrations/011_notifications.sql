-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  read boolean default false,
  type text not null default 'system' check (type in ('session', 'task', 'goal', 'system', 'journal')),
  link text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_notifications_created on public.notifications(created_at desc);
