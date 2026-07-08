-- ============================================================
-- MIGRATION 044: ADD APPLICATIONS TO REALTIME PUBLICATION
--
-- Applications was missing from the realtime publication,
-- which meant mentor dashboards wouldn't get live updates
-- when new applications were submitted.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'applications'
  ) then
    alter publication supabase_realtime add table public.applications;
  end if;
end $$;
