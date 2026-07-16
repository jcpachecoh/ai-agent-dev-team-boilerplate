-- AlterEnum
ALTER TYPE "CostCenter" ADD VALUE 'ROTANTE';

-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('TURNO_ASIGNADO', 'MARCACION_ASISTENCIA', 'MANUAL');

-- AlterTable
ALTER TABLE "employee_details" ALTER COLUMN "locationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "daily_cost_center_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftId" TEXT,
    "source" "AssignmentSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_cost_center_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_cost_center_assignments_tenantId_employeeId_date_key" ON "daily_cost_center_assignments"("tenantId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "daily_cost_center_assignments_tenantId_employeeId_date_idx" ON "daily_cost_center_assignments"("tenantId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "daily_cost_center_assignments_tenantId_locationId_date_idx" ON "daily_cost_center_assignments"("tenantId", "locationId", "date");

-- AddForeignKey
ALTER TABLE "daily_cost_center_assignments" ADD CONSTRAINT "daily_cost_center_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_cost_center_assignments" ADD CONSTRAINT "daily_cost_center_assignments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
