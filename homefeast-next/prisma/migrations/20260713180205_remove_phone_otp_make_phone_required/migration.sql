-- Backfill existing users that don't have a phone number with a unique placeholder.
-- These accounts can update their phone number from the profile page.
UPDATE "users"
SET "phone" = '+91' || SUBSTRING(REPLACE("id"::text, '-', ''), 1, 10)
WHERE "phone" IS NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isPhoneVerified",
DROP COLUMN "otpAttempts",
DROP COLUMN "otpExpires",
DROP COLUMN "otpHash",
DROP COLUMN "otpPhone",
DROP COLUMN "otpResendCount",
DROP COLUMN "otpSentAt",
ALTER COLUMN "phone" SET NOT NULL;
