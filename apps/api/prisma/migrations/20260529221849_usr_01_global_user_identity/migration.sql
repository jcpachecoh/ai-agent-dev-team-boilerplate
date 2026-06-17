-- USR-01: global Role + User tables, nullable OperationalUser.userId link.
-- Runs AFTER main drop_testlab (20260529221847) + optional remap (20260529221848).
-- Idempotent — safe on fresh DBs and partial re-runs.
-- Intentionally excludes:
--   - audit_logs.userId FK to users (deferred)
--   - password_reset_tokens.userId FK to users (deferred)

-- Remove orphaned TestLab user table from aborted pre-reorder USR-01 attempts.
DROP TABLE IF EXISTS "users_testlab";

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "DocumentType" AS ENUM ('CC', 'CE', 'PASAPORTE', 'TI', 'PEP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable — global User (physical table "users")
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "roles_tenantId_isActive_idx" ON "roles"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "roles_tenantId_code_key" ON "roles"("tenantId", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_tenantId_roleId_idx" ON "users"("tenantId", "roleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_tenantId_isActive_idx" ON "users"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_cedula_key" ON "users"("tenantId", "cedula");

-- AlterTable
ALTER TABLE "operational_users" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "operational_users_userId_key" ON "operational_users"("userId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_roleId_fkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'operational_users_userId_fkey'
  ) THEN
    ALTER TABLE "operational_users" ADD CONSTRAINT "operational_users_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
