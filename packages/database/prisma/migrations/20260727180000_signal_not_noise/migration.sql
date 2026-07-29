-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('SUPPRESS', 'UNSUPPRESS', 'KICK');

-- AlterTable User moderation
ALTER TABLE "User" ADD COLUMN "suppressedUntil" TIMESTAMP(3),
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "moderatedById" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3);

-- AlterTable Team telemetry channels
ALTER TABLE "Team" ADD COLUMN "adminLogsChannelId" TEXT,
ADD COLUMN "purchasingManagerRoleId" TEXT,
ADD COLUMN "digestHourLocal" INTEGER NOT NULL DEFAULT 17,
ADD COLUMN "digestTimezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- AlterTable InventoryItem closed-loop
ALTER TABLE "InventoryItem" ADD COLUMN "lowStockThreshold" INTEGER,
ADD COLUMN "restockPending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "orderPlacedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ModerationEvent" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "until" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamDigestBuffer" (
    "teamId" TEXT NOT NULL,
    "counters" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFlushedDateKey" TEXT,

    CONSTRAINT "TeamDigestBuffer_pkey" PRIMARY KEY ("teamId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ModerationEvent" ADD CONSTRAINT "ModerationEvent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModerationEvent" ADD CONSTRAINT "ModerationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamDigestBuffer" ADD CONSTRAINT "TeamDigestBuffer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ModerationEvent_targetUserId_idx" ON "ModerationEvent"("targetUserId");
CREATE INDEX "ModerationEvent_actorId_idx" ON "ModerationEvent"("actorId");
CREATE INDEX "ModerationEvent_createdAt_idx" ON "ModerationEvent"("createdAt");
