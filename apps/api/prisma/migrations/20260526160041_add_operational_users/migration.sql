-- CreateEnum
CREATE TYPE "OperationalRole" AS ENUM ('OWNER', 'SUPERVISOR', 'MANAGER', 'OPERATOR');

-- CreateTable
CREATE TABLE "operational_users" (
    "id" TEXT NOT NULL,
    "cedulaHash" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "role" "OperationalRole" NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sedeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operational_users_tenantId_idx" ON "operational_users"("tenantId");

-- CreateIndex
CREATE INDEX "operational_users_tenantId_role_idx" ON "operational_users"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "operational_users_tenantId_cedulaHash_key" ON "operational_users"("tenantId", "cedulaHash");
