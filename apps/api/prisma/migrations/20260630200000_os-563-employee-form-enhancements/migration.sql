-- OS-563: Employee Form Enhancements
-- Adds CostCenter, LaborClassification enums and new fields to EmployeeDetails
-- Adds TUTOR to EmployeeRelationshipType

-- CreateEnum
CREATE TYPE "CostCenter" AS ENUM ('ADMINISTRATIVO', 'OPERACIONES', 'PLANTA', 'GERENCIA', 'INCAPACIDADES');

-- CreateEnum
CREATE TYPE "LaborClassification" AS ENUM ('COCINA', 'SERVICIO', 'ADMINISTRATIVO');

-- AlterEnum
ALTER TYPE "EmployeeRelationshipType" ADD VALUE 'TUTOR';

-- AlterTable
ALTER TABLE "employee_details"
ADD COLUMN "barrio" TEXT,
ADD COLUMN "costCenter" "CostCenter" NOT NULL DEFAULT 'OPERACIONES',
ADD COLUMN "laborClassification" "LaborClassification" NOT NULL DEFAULT 'ADMINISTRATIVO',
ADD COLUMN "localidad" TEXT,
ADD COLUMN "nonSalaryAmount" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "employee_details_tenantId_costCenter_idx" ON "employee_details"("tenantId", "costCenter");

-- CreateIndex
CREATE INDEX "employee_details_tenantId_laborClassification_idx" ON "employee_details"("tenantId", "laborClassification");
