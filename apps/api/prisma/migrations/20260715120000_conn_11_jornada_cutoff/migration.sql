-- CreateEnum
CREATE TYPE "AttendanceMarkingScope" AS ENUM ('ORDINARY', 'OVERTIME');

-- CreateEnum
CREATE TYPE "JornadaCutoffType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterEnum
ALTER TYPE "AttendanceLogSource" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "attendance_logs" ADD COLUMN "markingScope" "AttendanceMarkingScope" NOT NULL DEFAULT 'ORDINARY';

-- CreateIndex
CREATE INDEX "attendance_logs_tenantId_employeeId_workDate_markingScope_idx" ON "attendance_logs"("tenantId", "employeeId", "workDate", "markingScope");

-- CreateTable
CREATE TABLE "jornada_cutoffs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "shiftEndTime" TIMESTAMP(3) NOT NULL,
    "cutoffAt" TIMESTAMP(3) NOT NULL,
    "cutoffType" "JornadaCutoffType" NOT NULL DEFAULT 'AUTOMATIC',
    "entryLogId" TEXT,
    "exitLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jornada_cutoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jornada_cutoffs_tenantId_workDate_idx" ON "jornada_cutoffs"("tenantId", "workDate");

-- CreateIndex
CREATE INDEX "jornada_cutoffs_tenantId_locationId_workDate_idx" ON "jornada_cutoffs"("tenantId", "locationId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "jornada_cutoffs_tenantId_employeeId_workDate_key" ON "jornada_cutoffs"("tenantId", "employeeId", "workDate");

-- AddForeignKey
ALTER TABLE "jornada_cutoffs" ADD CONSTRAINT "jornada_cutoffs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornada_cutoffs" ADD CONSTRAINT "jornada_cutoffs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
