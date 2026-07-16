-- AlterTable
ALTER TABLE "auth_accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0;
