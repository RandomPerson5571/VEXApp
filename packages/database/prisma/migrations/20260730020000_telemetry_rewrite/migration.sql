-- 1. Add new channel columns
ALTER TABLE "DiscordGuildSettings"
  ADD COLUMN IF NOT EXISTS "securityLogsChannelId" TEXT,
  ADD COLUMN IF NOT EXISTS "infoLogsChannelId" TEXT,
  ADD COLUMN IF NOT EXISTS "inventoryLogsChannelId" TEXT;

-- 2. Migrate existing admin log channels → security
UPDATE "DiscordGuildSettings"
SET "securityLogsChannelId" = "adminLogsChannelId"
WHERE "adminLogsChannelId" IS NOT NULL;

-- 3. Drop obsolete columns and tables
ALTER TABLE "DiscordGuildSettings" DROP COLUMN IF EXISTS "adminLogsChannelId";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "annoucementsChannelId",
  DROP COLUMN IF EXISTS "digestHourLocal",
  DROP COLUMN IF EXISTS "digestTimezone";
ALTER TABLE "InventoryItem" DROP COLUMN IF EXISTS "restockPending",
  DROP COLUMN IF EXISTS "orderPlacedAt";
DROP TABLE IF EXISTS "TeamDigestBuffer";
