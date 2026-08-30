-- CreateEnum
CREATE TYPE "VacationType" AS ENUM ('DISFRUTE', 'COMPENSACION');

-- CreateEnum
CREATE TYPE "VacationStatus" AS ENUM ('SOLICITADA', 'APROBADA_NIVEL_1', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "vacation_balances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "accruedDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "takenDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "compensatedDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "lastAccrualDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacation_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacation_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysRequested" DECIMAL(6,2) NOT NULL,
    "type" "VacationType" NOT NULL,
    "status" "VacationStatus" NOT NULL DEFAULT 'SOLICITADA',
    "level1ApprovedBy" TEXT,
    "level1ActedAt" TIMESTAMP(3),
    "level2ApprovedBy" TEXT,
    "level2ActedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "letterStorageObjectId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vacation_balances_employeeId_key" ON "vacation_balances"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "vacation_balances_tenantId_employeeId_key" ON "vacation_balances"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "vacation_balances_tenantId_idx" ON "vacation_balances"("tenantId");

-- CreateIndex
CREATE INDEX "vacation_requests_tenantId_idx" ON "vacation_requests"("tenantId");

-- CreateIndex
CREATE INDEX "vacation_requests_tenantId_employeeId_idx" ON "vacation_requests"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "vacation_requests_tenantId_status_idx" ON "vacation_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "vacation_requests_tenantId_isActive_idx" ON "vacation_requests"("tenantId", "isActive");

-- AddForeignKey
ALTER TABLE "vacation_balances" ADD CONSTRAINT "vacation_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_letterStorageObjectId_fkey" FOREIGN KEY ("letterStorageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
