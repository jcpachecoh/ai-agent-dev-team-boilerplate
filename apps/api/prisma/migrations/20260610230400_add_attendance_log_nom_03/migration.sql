-- CreateEnum
CREATE TYPE "AttendanceEventType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "AttendanceShift" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "AttendanceOvertimeType" AS ENUM ('REGULAR', 'DIURNO', 'NOCTURNO', 'FESTIVO_DIURNO', 'FESTIVO_NOCTURNO');

-- AlterTable
ALTER TABLE "employee_details" ADD COLUMN     "pinHash" TEXT;

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "eventType" "AttendanceEventType" NOT NULL,
    "shift" "AttendanceShift",
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_logs_tenantId_employeeId_workDate_idx" ON "attendance_logs"("tenantId", "employeeId", "workDate");

-- CreateIndex
CREATE INDEX "attendance_logs_tenantId_locationId_workDate_idx" ON "attendance_logs"("tenantId", "locationId", "workDate");

-- CreateIndex
CREATE INDEX "attendance_logs_tenantId_workDate_idx" ON "attendance_logs"("tenantId", "workDate");

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
