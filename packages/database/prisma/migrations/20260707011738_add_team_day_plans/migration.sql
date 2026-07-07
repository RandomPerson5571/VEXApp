-- CreateEnum
CREATE TYPE "DayPlanType" AS ENUM ('BUILD', 'CODING', 'TESTING');

-- CreateTable
CREATE TABLE "team_day_plans" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "DayPlanType" NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_day_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_day_plans_team_id_idx" ON "team_day_plans"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_day_plans_team_id_date_key" ON "team_day_plans"("team_id", "date");

-- AddForeignKey
ALTER TABLE "team_day_plans" ADD CONSTRAINT "team_day_plans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_day_plans" ADD CONSTRAINT "team_day_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
