-- Resource increment function (used by frontend)
create or replace function public.increment_resource_field(row_id uuid, field text, delta int)
returns void as $$
begin
  execute format(
    'update public.resources set %I = greatest(0, %I + $1) where id = $2',
    field, field
  ) using delta, row_id;
end;
$$ language plpgsql security definer;
