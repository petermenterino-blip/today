DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE ONLY %I.%I', tbl.schemaname, tbl.tablename);
  END LOOP;
END $$;
