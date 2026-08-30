-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('CLOUDFLARE_R2', 'LOCAL');

-- CreateEnum
CREATE TYPE "StorageVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "StorageDomain" AS ENUM ('BRANDING', 'INVENTORY', 'PRODUCTION', 'RECIPES', 'PAYROLL', 'USERS');

-- CreateEnum
CREATE TYPE "StorageObjectStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "storage_objects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "StorageProviderType" NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "etag" TEXT,
    "originalName" TEXT NOT NULL,
    "domain" "StorageDomain" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "visibility" "StorageVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "StorageObjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "storage_objects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storage_objects_key_key" ON "storage_objects"("key");

-- CreateIndex
CREATE INDEX "storage_objects_tenantId_idx" ON "storage_objects"("tenantId");

-- CreateIndex
CREATE INDEX "storage_objects_tenantId_domain_idx" ON "storage_objects"("tenantId", "domain");

-- CreateIndex
CREATE INDEX "storage_objects_tenantId_status_idx" ON "storage_objects"("tenantId", "status");

-- CreateIndex
CREATE INDEX "storage_objects_entityType_entityId_idx" ON "storage_objects"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "storage_objects_deletedAt_idx" ON "storage_objects"("deletedAt");
