-- Fix infinite RLS recursion on profiles table
-- The is_mentor() helper was querying profiles inside a profiles policy,
-- causing infinite recursion. Now reads from auth.users metadata instead.

create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
    and raw_user_meta_data->>'role' = 'mentor'
  );
$$;
