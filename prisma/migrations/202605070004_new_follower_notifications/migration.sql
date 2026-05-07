ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCH', 'NEW_MESSAGE', 'POST_LIKE', 'POST_COMMENT', 'EVENT_REMINDER', 'FOLLOW_REQUEST', 'NEW_FOLLOWER');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType" USING "type"::text::"NotificationType";
DROP TYPE "NotificationType_old";
