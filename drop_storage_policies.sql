DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'storage' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;
