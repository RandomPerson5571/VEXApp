-- Cascade delete public.User when a Supabase auth.users row is removed.
-- Apply manually in the Supabase SQL editor or via `supabase db execute`.
-- On Supabase, this is also created by Prisma migration 20260702190000_auth_user_delete_cascade.

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

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_auth_user();
