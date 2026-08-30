-- CreateEnum
CREATE TYPE "SupplierDeliveryMode" AS ENUM ('SUPPLIER_DELIVERS', 'COMPANY_PICKUP');

-- CreateEnum
CREATE TYPE "SupplierDeliveryPlace" AS ENUM ('PLANT', 'PDV', 'WAREHOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierTransportType" AS ENUM ('OWN', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "SupplierLogisticsStatus" AS ENUM ('DRAFT', 'COMPLETE');

-- CreateEnum
CREATE TYPE "SupplierTransportCostCurrency" AS ENUM ('COP', 'USD');

-- CreateTable
CREATE TABLE "supplier_logistics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "deliveryMode" "SupplierDeliveryMode",
    "deliveryPlace" "SupplierDeliveryPlace",
    "deliveryPlaceCustom" TEXT,
    "deliveryDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "leadTimeDays" INTEGER,
    "timeWindowStart" TEXT,
    "timeWindowEnd" TEXT,
    "receptionResponsibleUserId" TEXT,
    "transportType" "SupplierTransportType",
    "requiresColdChain" BOOLEAN NOT NULL DEFAULT false,
    "transportTempMinC" DECIMAL(5,2),
    "transportTempMaxC" DECIMAL(5,2),
    "transportCost" DECIMAL(12,2),
    "transportCostCurrency" "SupplierTransportCostCurrency",
    "minimumOrderQty" DECIMAL(12,2),
    "minimumOrderUnit" TEXT,
    "status" "SupplierLogisticsStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_logistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_logistics_coverage" (
    "supplierLogisticsId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_logistics_coverage_pkey" PRIMARY KEY ("supplierLogisticsId","locationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_logistics_supplierId_key" ON "supplier_logistics"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_logistics_tenantId_idx" ON "supplier_logistics"("tenantId");

-- CreateIndex
CREATE INDEX "supplier_logistics_receptionResponsibleUserId_idx" ON "supplier_logistics"("receptionResponsibleUserId");

-- CreateIndex
CREATE INDEX "supplier_logistics_coverage_tenantId_idx" ON "supplier_logistics_coverage"("tenantId");

-- CreateIndex
CREATE INDEX "supplier_logistics_coverage_locationId_idx" ON "supplier_logistics_coverage"("locationId");

-- AddForeignKey
ALTER TABLE "supplier_logistics" ADD CONSTRAINT "supplier_logistics_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_logistics" ADD CONSTRAINT "supplier_logistics_receptionResponsibleUserId_fkey" FOREIGN KEY ("receptionResponsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_logistics_coverage" ADD CONSTRAINT "supplier_logistics_coverage_supplierLogisticsId_fkey" FOREIGN KEY ("supplierLogisticsId") REFERENCES "supplier_logistics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_logistics_coverage" ADD CONSTRAINT "supplier_logistics_coverage_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
