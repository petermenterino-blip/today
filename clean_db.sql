-- Drop all storage policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'storage' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Clear realtime publication
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE ONLY %I.%I', tbl.schemaname, tbl.tablename);
  END LOOP;
END $$;

-- Drop all tables in public schema
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_supabase_migrations' LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl.tablename);
  END LOOP;
END $$;
