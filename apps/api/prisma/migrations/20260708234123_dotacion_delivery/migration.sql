-- CreateEnum
CREATE TYPE "DotacionStatus" AS ENUM ('PENDIENTE', 'ENTREGADA', 'NO_APLICA');

-- CreateTable
CREATE TABLE "dotacion_deliveries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "supplyItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" TIMESTAMP(3),
    "status" "DotacionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "signedReceiptUrl" TEXT,
    "stockMovementId" TEXT,
    "noAplicaReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dotacion_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dotacion_deliveries_tenantId_idx" ON "dotacion_deliveries"("tenantId");

-- CreateIndex
CREATE INDEX "dotacion_deliveries_employeeId_idx" ON "dotacion_deliveries"("employeeId");

-- CreateIndex
CREATE INDEX "dotacion_deliveries_supplyItemId_idx" ON "dotacion_deliveries"("supplyItemId");

-- CreateIndex
CREATE INDEX "dotacion_deliveries_tenantId_period_idx" ON "dotacion_deliveries"("tenantId", "period");

-- CreateIndex
CREATE INDEX "dotacion_deliveries_deletedAt_idx" ON "dotacion_deliveries"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "dotacion_deliveries_employeeId_period_key" ON "dotacion_deliveries"("employeeId", "period");

-- AddForeignKey
ALTER TABLE "dotacion_deliveries" ADD CONSTRAINT "dotacion_deliveries_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "employee_shift_assignments_tenantId_employeeId_effectiveFrom_id" RENAME TO "employee_shift_assignments_tenantId_employeeId_effectiveFro_idx";
