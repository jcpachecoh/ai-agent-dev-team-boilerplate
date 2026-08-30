-- CreateEnum
CREATE TYPE "EmployeeCatalogType" AS ENUM ('EPS', 'ARL', 'PENSION_FUND', 'CESANTIAS_FUND', 'CAJA_COMPENSACION', 'AREA', 'DEPARTMENT');

-- CreateTable
CREATE TABLE "employee_catalog_options" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "EmployeeCatalogType" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_catalog_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_catalog_options_tenantId_type_isActive_idx" ON "employee_catalog_options"("tenantId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "employee_catalog_options_tenantId_type_name_key" ON "employee_catalog_options"("tenantId", "type", "name");
