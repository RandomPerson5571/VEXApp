-- Move admin logs from per-team to per-guild settings

ALTER TABLE "DiscordGuildSettings" ADD COLUMN IF NOT EXISTS "adminLogsChannelId" TEXT;

-- Preserve existing team-scoped admin-log channels onto their linked guild
INSERT INTO "DiscordGuildSettings" ("guildId", "adminLogsChannelId", "createdAt", "updatedAt")
SELECT t."discordServerId", t."adminLogsChannelId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Team" t
WHERE t."discordServerId" IS NOT NULL
  AND t."adminLogsChannelId" IS NOT NULL
ON CONFLICT ("guildId") DO UPDATE
SET
  "adminLogsChannelId" = COALESCE(
    "DiscordGuildSettings"."adminLogsChannelId",
    EXCLUDED."adminLogsChannelId"
  ),
  "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "Team" DROP COLUMN IF EXISTS "adminLogsChannelId";
