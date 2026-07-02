-- Align Team table with schema: Team.updatedAt was missing from initial migration.
ALTER TABLE "Team" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
