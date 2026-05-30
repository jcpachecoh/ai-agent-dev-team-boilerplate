-- USR-01 bridge (runs AFTER main drop_testlab).
-- No-op when legacy TestLab users was already removed by 20260529221847.
-- Handles partial local DBs where legacy TestLab-shaped users still exists:
-- renames users → users_testlab so 20260529221849 can create global users on "users".

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND to_regclass('public.users_testlab') IS NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'name'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'tenantId'
     )
  THEN
    ALTER TABLE "users" RENAME TO "users_testlab";
  END IF;
END $$;
