/*
  Warnings:

  - You are about to drop the column `authUserId` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('EMAIL', 'DISCORD', 'UNVERIFIED');

-- DropIndex
DROP INDEX "User_authUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "authUserId",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationMethod" "VerificationMethod" NOT NULL DEFAULT 'UNVERIFIED',
ALTER COLUMN "discordId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "NotebookLog" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotebookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invite_teamId_idx" ON "Invite"("teamId");

-- AddForeignKey
ALTER TABLE "NotebookLog" ADD CONSTRAINT "NotebookLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookLog" ADD CONSTRAINT "NotebookLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
