-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'BOTH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "googleId" VARCHAR(255),
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL';

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");
