/*
  Warnings:

  - You are about to drop the `NotebookLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NotebookLog" DROP CONSTRAINT "NotebookLog_teamId_fkey";

-- DropForeignKey
ALTER TABLE "NotebookLog" DROP CONSTRAINT "NotebookLog_userId_fkey";

-- AlterTable
ALTER TABLE "ScoutNote" ADD COLUMN     "autonReliability" INTEGER,
ADD COLUMN     "driveRating" INTEGER,
ADD COLUMN     "formNotes" TEXT,
ADD COLUMN     "mechanisms" TEXT,
ADD COLUMN     "pickRank" INTEGER;

-- DropTable
DROP TABLE "NotebookLog";

-- CreateIndex
CREATE INDEX "ScoutNote_teamId_pickRank_idx" ON "ScoutNote"("teamId", "pickRank");
