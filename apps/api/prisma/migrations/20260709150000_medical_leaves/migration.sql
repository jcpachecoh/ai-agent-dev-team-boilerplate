-- CreateEnum
CREATE TYPE "LeaveOrigin" AS ENUM ('COMUN', 'LABORAL');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('REGISTRADA', 'RADICADA_EPS', 'RECOBRADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "medical_leaves" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "origin" "LeaveOrigin" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "employerPaidDays" INTEGER NOT NULL,
    "epsArlPaidDays" INTEGER NOT NULL,
    "epsArlAmount" DECIMAL(12,2),
    "employerAmount" DECIMAL(12,2) NOT NULL,
    "supportStorageObjectId" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'REGISTRADA',
    "radicatedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "medical_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_leaves_tenantId_idx" ON "medical_leaves"("tenantId");

-- CreateIndex
CREATE INDEX "medical_leaves_tenantId_employeeId_idx" ON "medical_leaves"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "medical_leaves_tenantId_status_idx" ON "medical_leaves"("tenantId", "status");

-- CreateIndex
CREATE INDEX "medical_leaves_tenantId_deletedAt_idx" ON "medical_leaves"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "medical_leaves_tenantId_startDate_endDate_idx" ON "medical_leaves"("tenantId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "medical_leaves" ADD CONSTRAINT "medical_leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_leaves" ADD CONSTRAINT "medical_leaves_supportStorageObjectId_fkey" FOREIGN KEY ("supportStorageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
