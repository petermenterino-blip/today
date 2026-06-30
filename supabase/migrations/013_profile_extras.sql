-- Profile extras for frontend settings
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists settings jsonb default '{}'::jsonb;
