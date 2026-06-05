-- MES-09: Production order document fields (materials, byproducts, quality checks, route-of-process)

-- CreateEnum
CREATE TYPE "ProductionQualityCheckType" AS ENUM ('LIBERACION_MP', 'CORRECCION', 'ACCION_CORRECTIVA', 'ENTREGA', 'RECIBE');

-- AlterTable
ALTER TABLE "production_orders" ADD COLUMN     "lotNumber" TEXT,
ADD COLUMN     "productionDate" TIMESTAMP(3),
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "packageWeight" DECIMAL(10,3),
ADD COLUMN     "batchWeight" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "phase_executions" ADD COLUMN     "operatorCount" INTEGER,
ADD COLUMN     "deliveredQuantity" DECIMAL(10,3),
ADD COLUMN     "responsibleUserId" TEXT;

-- CreateTable
CREATE TABLE "production_order_materials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplyItemId" TEXT,
    "materialName" TEXT NOT NULL,
    "lotNumber" TEXT,
    "requiredQuantity" DECIMAL(10,3) NOT NULL,
    "consumedQuantity" DECIMAL(10,3),
    "unit" "StockUnit" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "production_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_byproducts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unit" "StockUnit" NOT NULL,
    "actualQuantity" DECIMAL(10,3),
    "lotNumber" TEXT,
    "expirationDate" TIMESTAMP(3),

    CONSTRAINT "production_byproducts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_quality_checks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "checkType" "ProductionQualityCheckType" NOT NULL,
    "temperature" TEXT,
    "color" TEXT,
    "smell" TEXT,
    "texture" TEXT,
    "notes" TEXT,

    CONSTRAINT "production_quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_order_materials_orderId_idx" ON "production_order_materials"("orderId");

-- CreateIndex
CREATE INDEX "production_order_materials_tenantId_orderId_idx" ON "production_order_materials"("tenantId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_materials_orderId_supplyItemId_key" ON "production_order_materials"("orderId", "supplyItemId");

-- CreateIndex
CREATE INDEX "production_byproducts_orderId_idx" ON "production_byproducts"("orderId");

-- CreateIndex
CREATE INDEX "production_byproducts_tenantId_orderId_idx" ON "production_byproducts"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "production_quality_checks_orderId_idx" ON "production_quality_checks"("orderId");

-- CreateIndex
CREATE INDEX "production_quality_checks_tenantId_orderId_idx" ON "production_quality_checks"("tenantId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "production_quality_checks_orderId_checkType_key" ON "production_quality_checks"("orderId", "checkType");

-- CreateIndex
CREATE INDEX "phase_executions_responsibleUserId_idx" ON "phase_executions"("responsibleUserId");

-- AddForeignKey
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_byproducts" ADD CONSTRAINT "production_byproducts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_quality_checks" ADD CONSTRAINT "production_quality_checks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_executions" ADD CONSTRAINT "phase_executions_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "operational_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
