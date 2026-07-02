-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableDiscordPushNotifs" BOOLEAN NOT NULL DEFAULT true,
    "githubNotifsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "githubEvents" TEXT[] DEFAULT ARRAY['push', 'pull_request']::TEXT[],
    "fusionNotifsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGitHubIntegration" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "repositoryId" INTEGER,
    "repositoryFullName" TEXT NOT NULL,
    "repositoryUrl" TEXT,
    "webhookId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamGitHubIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamFusionIntegration" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "projectUrn" TEXT NOT NULL,
    "projectName" TEXT,
    "hookId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamFusionIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGitHubIntegration_teamId_key" ON "TeamGitHubIntegration"("teamId");

-- CreateIndex
CREATE INDEX "TeamGitHubIntegration_repositoryFullName_idx" ON "TeamGitHubIntegration"("repositoryFullName");

-- CreateIndex
CREATE UNIQUE INDEX "TeamFusionIntegration_teamId_key" ON "TeamFusionIntegration"("teamId");

-- CreateIndex
CREATE INDEX "TeamFusionIntegration_projectUrn_idx" ON "TeamFusionIntegration"("projectUrn");

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGitHubIntegration" ADD CONSTRAINT "TeamGitHubIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFusionIntegration" ADD CONSTRAINT "TeamFusionIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
