-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailOtpResendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailOtpSentAt" TIMESTAMP(3);
