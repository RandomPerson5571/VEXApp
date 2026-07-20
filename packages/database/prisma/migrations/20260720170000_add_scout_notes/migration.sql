-- CreateTable
CREATE TABLE "ScoutNote" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "targetTeamNumber" TEXT NOT NULL,
    "targetTeamName" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoutNote_teamId_idx" ON "ScoutNote"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutNote_teamId_targetTeamNumber_key" ON "ScoutNote"("teamId", "targetTeamNumber");

-- AddForeignKey
ALTER TABLE "ScoutNote" ADD CONSTRAINT "ScoutNote_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutNote" ADD CONSTRAINT "ScoutNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
