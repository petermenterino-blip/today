-- ============================================================
-- MIGRATION 049: ADD APPLICATION_NOTES TO REALTIME PUBLICATION
--
-- application_notes was missing from the realtime publication,
-- so mentor dashboards wouldn't see new notes in realtime.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'application_notes'
  ) then
    alter publication supabase_realtime add table public.application_notes;
  end if;
end $$;
