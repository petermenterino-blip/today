-- Fix infinite RLS recursion on profiles table
-- The original is_mentor() helper (language sql) was inlined into the RLS policy,
-- so querying profiles inside a profiles policy caused infinite recursion.
-- Using plpgsql prevents inlining, and security definer bypasses RLS so we can
-- safely read profiles.role (the authoritative role source) instead of
-- auth.users.raw_user_meta_data (which is only set at signup and never synced).

create or replace function public.is_mentor()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'mentor'
  );
end;
$$;
