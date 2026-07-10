-- CreateEnum
CREATE TYPE "OvertimeRequestType" AS ENUM ('DETECCION_AUTOMATICA', 'SOLICITUD_ADMINISTRATIVA');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('PENDIENTE_ADMIN', 'PENDIENTE_GERENCIA_OPERACIONES', 'PENDIENTE_GERENCIA_GENERAL', 'APROBADA', 'OBJETADA');

-- CreateEnum
CREATE TYPE "OvertimeApprovalLevel" AS ENUM ('ADMINISTRADOR', 'GERENCIA_OPERACIONES', 'GERENCIA_GENERAL');

-- CreateEnum
CREATE TYPE "OvertimeApprovalDecision" AS ENUM ('APROBADO', 'OBJETADO');

-- CreateTable
CREATE TABLE "overtime_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "type" "OvertimeRequestType" NOT NULL,
    "shiftEndTime" TIMESTAMP(3) NOT NULL,
    "actualEndTime" TIMESTAMP(3) NOT NULL,
    "accumulatedMinutes" INTEGER NOT NULL,
    "status" "OvertimeStatus" NOT NULL DEFAULT 'PENDIENTE_ADMIN',
    "payrollPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_approvals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "overtimeRequestId" TEXT NOT NULL,
    "level" "OvertimeApprovalLevel" NOT NULL,
    "approverId" TEXT,
    "decision" "OvertimeApprovalDecision",
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "overtime_requests_tenantId_idx" ON "overtime_requests"("tenantId");

-- CreateIndex
CREATE INDEX "overtime_requests_tenantId_employeeId_idx" ON "overtime_requests"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "overtime_requests_tenantId_locationId_idx" ON "overtime_requests"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "overtime_requests_tenantId_status_idx" ON "overtime_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "overtime_requests_tenantId_payrollPeriod_idx" ON "overtime_requests"("tenantId", "payrollPeriod");

-- CreateIndex
CREATE INDEX "overtime_requests_tenantId_deletedAt_idx" ON "overtime_requests"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "overtime_requests_tenantId_employeeId_locationId_payrollPer_key" ON "overtime_requests"("tenantId", "employeeId", "locationId", "payrollPeriod", "type");

-- CreateIndex
CREATE INDEX "overtime_approvals_tenantId_idx" ON "overtime_approvals"("tenantId");

-- CreateIndex
CREATE INDEX "overtime_approvals_tenantId_overtimeRequestId_idx" ON "overtime_approvals"("tenantId", "overtimeRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "overtime_approvals_overtimeRequestId_level_key" ON "overtime_approvals"("overtimeRequestId", "level");

-- AddForeignKey
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_approvals" ADD CONSTRAINT "overtime_approvals_overtimeRequestId_fkey" FOREIGN KEY ("overtimeRequestId") REFERENCES "overtime_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_approvals" ADD CONSTRAINT "overtime_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
