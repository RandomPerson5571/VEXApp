-- AlterTable
ALTER TABLE "Invite" ADD COLUMN "reservedAt" TIMESTAMP(3),
ADD COLUMN "reservedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Invite_reservedByUserId_idx" ON "Invite"("reservedByUserId");
