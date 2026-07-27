-- AlterTable
ALTER TABLE "ScoutNote" ADD COLUMN "doNotPick" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScoutNote" ADD COLUMN "crossedOff" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ScoutNote_teamId_doNotPick_idx" ON "ScoutNote"("teamId", "doNotPick");
