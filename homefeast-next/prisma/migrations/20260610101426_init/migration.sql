-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('pending', 'approved', 'suspended');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'all');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'online', 'wallet');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order_created', 'order_accepted', 'order_rejected', 'order_delivered', 'subscription_expiring', 'new_review', 'provider_approved', 'complaint_resolved');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('food_quality', 'delivery', 'payment', 'provider', 'other');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('fssai_license', 'id_proof', 'address_proof', 'bank_statement');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('percentage', 'flat');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "avatar" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "refreshToken" TEXT,
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" VARCHAR(50) NOT NULL DEFAULT 'Home',
    "street" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "businessName" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "coverImage" VARCHAR(500),
    "street" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "deliveryRadius" INTEGER NOT NULL DEFAULT 10,
    "minOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "ProviderStatus" NOT NULL DEFAULT 'pending',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "openTime" VARCHAR(10),
    "closeTime" VARCHAR(10),
    "bankAccountHolder" VARCHAR(100),
    "bankAccountNumber" VARCHAR(50),
    "bankIfsc" VARCHAR(20),
    "upiId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_availability" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "openTime" VARCHAR(10) NOT NULL,
    "closeTime" VARCHAR(10) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_service_areas" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_documents" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "rejectionNote" VARCHAR(300),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(300),
    "image" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisines" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_cuisines" (
    "providerId" UUID NOT NULL,
    "cuisineId" UUID NOT NULL,

    CONSTRAINT "provider_cuisines_pkey" PRIMARY KEY ("providerId","cuisineId")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "cuisineId" UUID,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "price" DECIMAL(10,2) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "isVeg" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "preparationTime" INTEGER NOT NULL DEFAULT 30,
    "calories" INTEGER,
    "protein" DECIMAL(6,2),
    "carbs" DECIMAL(6,2),
    "fat" DECIMAL(6,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_images" (
    "id" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "altText" VARCHAR(200),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "mealType" "MealType" NOT NULL,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 1,
    "daysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "pricePerMonth" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(30) NOT NULL,
    "customerId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "addressId" UUID,
    "deliveryStreet" VARCHAR(255),
    "deliveryCity" VARCHAR(100),
    "deliveryState" VARCHAR(100),
    "deliveryPincode" VARCHAR(10),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cod',
    "scheduledFor" TIMESTAMP(3),
    "notes" VARCHAR(500),
    "rejectionReason" VARCHAR(300),
    "isSubscriptionOrder" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionId" UUID,
    "couponId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "mealPlanId" UUID NOT NULL,
    "addressId" UUID,
    "planName" VARCHAR(100) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 1,
    "daysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "pricePerMonth" DECIMAL(10,2) NOT NULL,
    "deliveryStreet" VARCHAR(255),
    "deliveryCity" VARCHAR(100),
    "deliveryState" VARCHAR(100),
    "deliveryPincode" VARCHAR(10),
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "pausedUntil" TIMESTAMP(3),
    "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(1000),
    "images" VARCHAR(500)[],
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "providerReply" VARCHAR(500),
    "providerRepliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "providerId" UUID,
    "orderId" UUID,
    "subject" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'open',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'medium',
    "resolution" VARCHAR(1000),
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "orderId" UUID,
    "subscriptionId" UUID,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'INR',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "gatewayTxnId" VARCHAR(255),
    "gatewayResponse" JSONB,
    "refundAmount" DECIMAL(10,2),
    "refundedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "orderId" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(300),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "description" VARCHAR(300),
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxDiscount" DECIMAL(10,2),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE INDEX "user_addresses_city_idx" ON "user_addresses"("city");

-- CreateIndex
CREATE INDEX "user_addresses_pincode_idx" ON "user_addresses"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX "providers_userId_key" ON "providers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "providers_status_isAvailable_idx" ON "providers"("status", "isAvailable");

-- CreateIndex
CREATE INDEX "providers_city_idx" ON "providers"("city");

-- CreateIndex
CREATE INDEX "providers_rating_idx" ON "providers"("rating");

-- CreateIndex
CREATE INDEX "providers_deletedAt_idx" ON "providers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "provider_availability_providerId_day_key" ON "provider_availability"("providerId", "day");

-- CreateIndex
CREATE INDEX "provider_service_areas_city_idx" ON "provider_service_areas"("city");

-- CreateIndex
CREATE INDEX "provider_service_areas_pincode_idx" ON "provider_service_areas"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX "provider_service_areas_providerId_pincode_key" ON "provider_service_areas"("providerId", "pincode");

-- CreateIndex
CREATE INDEX "provider_documents_providerId_status_idx" ON "provider_documents"("providerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_name_key" ON "cuisines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_slug_key" ON "cuisines"("slug");

-- CreateIndex
CREATE INDEX "cuisines_slug_idx" ON "cuisines"("slug");

-- CreateIndex
CREATE INDEX "menu_items_providerId_isAvailable_idx" ON "menu_items"("providerId", "isAvailable");

-- CreateIndex
CREATE INDEX "menu_items_mealType_idx" ON "menu_items"("mealType");

-- CreateIndex
CREATE INDEX "menu_items_price_idx" ON "menu_items"("price");

-- CreateIndex
CREATE INDEX "menu_items_deletedAt_idx" ON "menu_items"("deletedAt");

-- CreateIndex
CREATE INDEX "menu_images_menuItemId_idx" ON "menu_images"("menuItemId");

-- CreateIndex
CREATE INDEX "meal_plans_providerId_isActive_idx" ON "meal_plans"("providerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_customerId_createdAt_idx" ON "orders"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_providerId_status_idx" ON "orders"("providerId", "status");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_deletedAt_idx" ON "orders"("deletedAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "subscriptions_customerId_status_idx" ON "subscriptions"("customerId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_providerId_status_idx" ON "subscriptions"("providerId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_endDate_status_idx" ON "subscriptions"("endDate", "status");

-- CreateIndex
CREATE INDEX "subscriptions_deletedAt_idx" ON "subscriptions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_key" ON "reviews"("orderId");

-- CreateIndex
CREATE INDEX "reviews_providerId_isVisible_idx" ON "reviews"("providerId", "isVisible");

-- CreateIndex
CREATE INDEX "reviews_customerId_idx" ON "reviews"("customerId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "complaints_status_priority_idx" ON "complaints"("status", "priority");

-- CreateIndex
CREATE INDEX "complaints_customerId_idx" ON "complaints"("customerId");

-- CreateIndex
CREATE INDEX "complaints_providerId_idx" ON "complaints"("providerId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_createdAt_idx" ON "notifications"("recipientId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");

-- CreateIndex
CREATE INDEX "earnings_providerId_createdAt_idx" ON "earnings"("providerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "earnings_settledAt_idx" ON "earnings"("settledAt");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_isActive_validUntil_idx" ON "coupons"("isActive", "validUntil");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_service_areas" ADD CONSTRAINT "provider_service_areas_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_cuisines" ADD CONSTRAINT "provider_cuisines_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_cuisines" ADD CONSTRAINT "provider_cuisines_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "cuisines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_images" ADD CONSTRAINT "menu_images_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
