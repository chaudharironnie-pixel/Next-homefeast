-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailOtpExpires" TIMESTAMP(3),
ADD COLUMN     "emailOtpHash" VARCHAR(255);
