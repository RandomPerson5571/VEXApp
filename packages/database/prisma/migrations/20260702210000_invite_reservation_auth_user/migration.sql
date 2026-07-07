-- Invite reservations are held by Supabase auth users before a public.User profile exists.
ALTER TABLE "Invite" DROP CONSTRAINT IF EXISTS "Invite_reservedByUserId_fkey";
