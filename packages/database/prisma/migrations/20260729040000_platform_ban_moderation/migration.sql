-- AlterEnum
ALTER TYPE "ModerationAction" ADD VALUE 'BAN';
ALTER TYPE "ModerationAction" ADD VALUE 'UNBAN';

-- AlterTable: platform ban state; drop denormalized moderation context
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3);

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_moderatedById_fkey";

ALTER TABLE "User" DROP COLUMN IF EXISTS "moderationReason",
DROP COLUMN IF EXISTS "moderatedById",
DROP COLUMN IF EXISTS "moderatedAt";
