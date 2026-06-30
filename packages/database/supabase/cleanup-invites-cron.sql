-- Supabase cron job: delete expired and exhausted invite links.
-- Apply manually in the Supabase SQL editor or via `supabase db execute`.
--
-- Prerequisites:
--   1. Enable pg_cron (Dashboard → Integrations → Cron, or see below).
--   2. Prisma "Invite" table must exist.
--
-- Deletes rows where:
--   - expiresAt is in the past, or
--   - usesCount has reached maxUses
--
-- Matches invite usability rules in apps/web/lib/auth/invite.ts.

-- Enable pg_cron once per project (safe to re-run; no-op if already enabled).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

CREATE OR REPLACE FUNCTION public.cleanup_old_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM "Invite"
  WHERE "expiresAt" < NOW()
     OR "usesCount" >= "maxUses";

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_invites() TO postgres;

-- Upserts if the job already exists (same job name).
SELECT cron.schedule(
  'cleanup-old-invites',
  '0 4 * * 0', -- Runs every Sunday at 4:00 AM
  $$ SELECT public.cleanup_old_invites(); $$
);
