-- USR-01 Task 06: global Role + User tables, nullable OperationalUser.userId link.
-- Prerequisite: 20260529120000_remap_user_testlab_table (users → users_testlab) must be applied first.
-- Intentionally excludes:
--   - audit_logs.userId FK to users (deferred; DB retains legacy FK to users_testlab)
--   - password_reset_tokens.userId FK to users (deferred)

-- Rename TestLab constraint/index names so global users table can use users_pkey / users_email_key.
ALTER TABLE "users_testlab" RENAME CONSTRAINT "users_pkey" TO "users_testlab_pkey";
ALTER INDEX "users_email_key" RENAME TO "users_testlab_email_key";

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CC', 'CE', 'PASAPORTE', 'TI', 'PEP');

-- CreateTable
CREATE TABLE "roles" (
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

-- CreateTable
CREATE TABLE "users" (
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
CREATE INDEX "roles_tenantId_isActive_idx" ON "roles"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_code_key" ON "roles"("tenantId", "code");

-- CreateIndex
CREATE INDEX "users_tenantId_roleId_idx" ON "users"("tenantId", "roleId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_tenantId_isActive_idx" ON "users"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_cedula_key" ON "users"("tenantId", "cedula");

-- AlterTable
ALTER TABLE "operational_users" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "operational_users_userId_key" ON "operational_users"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_users" ADD CONSTRAINT "operational_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
