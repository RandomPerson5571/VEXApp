-- Drop purchasing-manager role + attendance check-ins

ALTER TABLE "Team" DROP COLUMN IF EXISTS "purchasingManagerRoleId";

DROP TABLE IF EXISTS "attendance_check_ins";
