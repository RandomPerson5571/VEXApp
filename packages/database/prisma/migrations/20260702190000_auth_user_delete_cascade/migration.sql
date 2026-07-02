-- Allow User deletion to cascade or null-out dependent rows.
ALTER TABLE "NotebookLog" DROP CONSTRAINT "NotebookLog_userId_fkey";
ALTER TABLE "NotebookLog" ADD CONSTRAINT "NotebookLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryItemSignOut" DROP CONSTRAINT "InventoryItemSignOut_userId_fkey";
ALTER TABLE "InventoryItemSignOut" ADD CONSTRAINT "InventoryItemSignOut_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" DROP CONSTRAINT "tasks_created_by_fkey";
ALTER TABLE "tasks" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_reservedByUserId_fkey" FOREIGN KEY ("reservedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Delete public.User when the matching Supabase auth.users row is removed.
-- The trigger is skipped on Prisma's shadow database, which has no auth schema.
CREATE OR REPLACE FUNCTION public.handle_deleted_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public."User" WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
    CREATE TRIGGER on_auth_user_deleted
      AFTER DELETE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_deleted_auth_user();
  END IF;
END $$;
