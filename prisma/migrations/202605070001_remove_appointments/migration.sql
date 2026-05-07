DELETE FROM "Notification" WHERE "type" = 'APPOINTMENT_UPDATE';

DROP TABLE IF EXISTS "Appointment";
DROP TYPE IF EXISTS "AppointmentStatus";

ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCH', 'NEW_MESSAGE', 'POST_LIKE', 'POST_COMMENT', 'EVENT_REMINDER');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType" USING "type"::text::"NotificationType";
DROP TYPE "NotificationType_old";
