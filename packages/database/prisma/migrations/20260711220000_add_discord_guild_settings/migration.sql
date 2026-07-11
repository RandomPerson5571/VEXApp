-- AlterTable
ALTER TABLE "Team" ADD COLUMN "annoucementsChannelId" TEXT;

-- CreateTable
CREATE TABLE "DiscordGuildSettings" (
    "guildId" TEXT NOT NULL,
    "generalMemberRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordGuildSettings_pkey" PRIMARY KEY ("guildId")
);
