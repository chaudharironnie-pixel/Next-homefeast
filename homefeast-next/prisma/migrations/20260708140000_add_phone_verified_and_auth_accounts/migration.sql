-- Add phone verification state, phone OTP rate-limit columns, and social auth accounts

-- Add phone verification flag
ALTER TABLE "users" ADD COLUMN "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add phone OTP rate-limiting / audit columns
ALTER TABLE "users" ADD COLUMN "otpSentAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "otpResendCount" INTEGER NOT NULL DEFAULT 0;

-- Enforce unique phone numbers (one account per phone)
ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");

-- Index phone for fast lookups
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- Social / OAuth identity provider accounts
CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(100),
    "picture" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- Unique provider identity
CREATE UNIQUE INDEX "auth_accounts_provider_providerAccountId_key" ON "auth_accounts"("provider", "providerAccountId");

-- Index by user for fast lookup
CREATE INDEX "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- Foreign key to users with cascade delete
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
