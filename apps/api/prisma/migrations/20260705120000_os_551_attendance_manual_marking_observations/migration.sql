-- CreateEnum
CREATE TYPE "AttendanceLogSource" AS ENUM ('DEVICE', 'MANUAL');

-- AlterTable
ALTER TABLE "attendance_logs" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "manualParentLogId" TEXT,
ADD COLUMN     "manualReason" TEXT,
ADD COLUMN     "source" "AttendanceLogSource" NOT NULL DEFAULT 'DEVICE';

-- CreateTable
CREATE TABLE "attendance_observations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_observations_tenantId_employeeId_workDate_idx" ON "attendance_observations"("tenantId", "employeeId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_observations_tenantId_employeeId_workDate_key" ON "attendance_observations"("tenantId", "employeeId", "workDate");

-- CreateIndex
CREATE INDEX "attendance_logs_manualParentLogId_idx" ON "attendance_logs"("manualParentLogId");

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_manualParentLogId_fkey" FOREIGN KEY ("manualParentLogId") REFERENCES "attendance_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_observations" ADD CONSTRAINT "attendance_observations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_observations" ADD CONSTRAINT "attendance_observations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_observations" ADD CONSTRAINT "attendance_observations_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
