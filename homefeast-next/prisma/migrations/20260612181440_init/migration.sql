-- AlterEnum
ALTER TYPE "ProviderStatus" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otpExpires" TIMESTAMP(3),
ADD COLUMN     "otpHash" VARCHAR(255),
ADD COLUMN     "otpPhone" VARCHAR(20);
