-- Resource increment function (used by frontend)
-- Only allowlisted fields can be incremented to prevent SQL injection / column tampering
create or replace function public.increment_resource_field(row_id uuid, field text, delta int)
returns void as $$
begin
  if field not in ('views_count', 'downloads_count', 'completions_count', 'favorites_count') then
    raise exception 'permission denied: cannot increment field %', field;
  end if;
  execute format(
    'update public.resources set %I = greatest(0, %I + $1) where id = $2',
    field, field
  ) using delta, row_id;
end;
$$ language plpgsql security definer set search_path = public;
