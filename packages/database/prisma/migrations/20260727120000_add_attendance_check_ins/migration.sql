-- CreateTable
CREATE TABLE "attendance_check_ins" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "date" DATE NOT NULL,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_check_ins_team_id_date_idx" ON "attendance_check_ins"("team_id", "date");

-- CreateIndex
CREATE INDEX "attendance_check_ins_event_id_idx" ON "attendance_check_ins"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_check_ins_team_id_user_id_date_key" ON "attendance_check_ins"("team_id", "user_id", "date");

-- AddForeignKey
ALTER TABLE "attendance_check_ins" ADD CONSTRAINT "attendance_check_ins_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_check_ins" ADD CONSTRAINT "attendance_check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_check_ins" ADD CONSTRAINT "attendance_check_ins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
