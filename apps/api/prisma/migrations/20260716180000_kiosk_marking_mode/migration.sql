-- Shared tablet kiosk marking mode: KIOSK source, verification method, sessions.

-- AlterEnum
ALTER TYPE "AttendanceLogSource" ADD VALUE 'KIOSK';

-- CreateEnum
CREATE TYPE "AttendanceVerificationMethod" AS ENUM ('FACIAL_MATCH', 'PIN', 'NONE');

-- CreateTable
CREATE TABLE "kiosk_marking_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "activatedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kiosk_marking_sessions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "attendance_logs"
ADD COLUMN "verificationMethod" "AttendanceVerificationMethod",
ADD COLUMN "kioskSessionId" TEXT;

-- CreateIndex
CREATE INDEX "kiosk_marking_sessions_tenantId_locationId_idx" ON "kiosk_marking_sessions"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "kiosk_marking_sessions_tenantId_activatedByUserId_idx" ON "kiosk_marking_sessions"("tenantId", "activatedByUserId");

-- CreateIndex
CREATE INDEX "attendance_logs_kioskSessionId_idx" ON "attendance_logs"("kioskSessionId");

-- AddForeignKey
ALTER TABLE "kiosk_marking_sessions" ADD CONSTRAINT "kiosk_marking_sessions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiosk_marking_sessions" ADD CONSTRAINT "kiosk_marking_sessions_activatedByUserId_fkey" FOREIGN KEY ("activatedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_kioskSessionId_fkey" FOREIGN KEY ("kioskSessionId") REFERENCES "kiosk_marking_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
