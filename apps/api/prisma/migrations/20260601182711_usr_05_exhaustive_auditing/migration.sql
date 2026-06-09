-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'APPROVE', 'REJECT', 'ASSIGN');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('PASSWORD', 'PIN', 'REFRESH_TOKEN', 'OAUTH_GOOGLE');

-- CreateEnum
CREATE TYPE "LoginAuditStatus" AS ENUM ('SUCCESS', 'FAILED', 'LOCKED', 'LOGOUT');

-- DropIndex
DROP INDEX "audit_logs_userId_idx";

-- AlterTable (Add columns as nullable first for safe backfill)
ALTER TABLE "audit_logs" ADD COLUMN "actorUserId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "newValue" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "oldValue" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT;

-- Backfill tenantId for existing records
UPDATE "audit_logs" SET "tenantId" = 'LEGACY' WHERE "tenantId" IS NULL;

-- Make tenantId NOT NULL
ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;

-- Safe conversion of 'action' column
ALTER TABLE "audit_logs" RENAME COLUMN "action" TO "action_old";
ALTER TABLE "audit_logs" ADD COLUMN "action" "AuditAction";

-- Map existing string actions to enum (case-sensitive)
UPDATE "audit_logs" SET "action" = 'CREATE' WHERE "action_old" = 'CREATE';
UPDATE "audit_logs" SET "action" = 'UPDATE' WHERE "action_old" IN ('UPDATE', 'PATCH', 'PUT');
UPDATE "audit_logs" SET "action" = 'DELETE' WHERE "action_old" = 'DELETE';

-- Handle any remaining actions or default to 'VIEW' if unknown, 
-- but since we are making it NOT NULL, we must ensure all are covered.
UPDATE "audit_logs" SET "action" = 'UPDATE' WHERE "action" IS NULL;

-- Make action NOT NULL and cleanup
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET NOT NULL;
ALTER TABLE "audit_logs" DROP COLUMN "action_old";

-- CreateTable
CREATE TABLE "login_audits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "identifier" TEXT NOT NULL,
    "authMethod" "AuthMethod" NOT NULL,
    "status" "LoginAuditStatus" NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_audits_tenantId_idx" ON "login_audits"("tenantId");

-- CreateIndex
CREATE INDEX "login_audits_userId_idx" ON "login_audits"("userId");

-- CreateIndex
CREATE INDEX "login_audits_status_idx" ON "login_audits"("status");

-- CreateIndex
CREATE INDEX "login_audits_createdAt_idx" ON "login_audits"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_audits" ADD CONSTRAINT "login_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
