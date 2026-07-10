-- CreateEnum
CREATE TYPE "NovedadType" AS ENUM ('AUSENCIA_INJUSTIFICADA', 'LICENCIA_LUTO', 'LICENCIA_PATERNIDAD', 'LICENCIA_MATERNIDAD', 'LICENCIA_NO_REMUNERADA', 'PERMISO_REMUNERADO', 'CALAMIDAD_DOMESTICA', 'DIA_FAMILIA');

-- CreateEnum
CREATE TYPE "NovedadRequestSource" AS ENUM ('EMPLEADO', 'RRHH');

-- CreateEnum
CREATE TYPE "NovedadStatus" AS ENUM ('SOLICITADA', 'PENDIENTE_SUPERVISOR', 'PENDIENTE_RRHH', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "payroll_novedades" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "NovedadType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isPaid" BOOLEAN NOT NULL,
    "linkedLeaveId" TEXT,
    "supportStorageObjectId" TEXT,
    "notes" TEXT,
    "requestedBy" "NovedadRequestSource" NOT NULL,
    "status" "NovedadStatus" NOT NULL DEFAULT 'SOLICITADA',
    "supervisorApproverId" TEXT,
    "supervisorDecisionAt" TIMESTAMP(3),
    "supervisorComment" TEXT,
    "rrhhApproverId" TEXT,
    "rrhhDecisionAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "overlapWarningAck" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_novedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedad_type_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "NovedadType" NOT NULL,
    "requiresSupervisorApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresSupportDocument" BOOLEAN NOT NULL DEFAULT false,
    "isPaidDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novedad_type_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_idx" ON "payroll_novedades"("tenantId");

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_employeeId_idx" ON "payroll_novedades"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_status_idx" ON "payroll_novedades"("tenantId", "status");

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_deletedAt_idx" ON "payroll_novedades"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_startDate_endDate_idx" ON "payroll_novedades"("tenantId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_type_idx" ON "payroll_novedades"("tenantId", "type");

-- CreateIndex
CREATE INDEX "novedad_type_configs_tenantId_idx" ON "novedad_type_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "novedad_type_configs_tenantId_type_key" ON "novedad_type_configs"("tenantId", "type");

-- AddForeignKey
ALTER TABLE "payroll_novedades" ADD CONSTRAINT "payroll_novedades_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_novedades" ADD CONSTRAINT "payroll_novedades_supportStorageObjectId_fkey" FOREIGN KEY ("supportStorageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
