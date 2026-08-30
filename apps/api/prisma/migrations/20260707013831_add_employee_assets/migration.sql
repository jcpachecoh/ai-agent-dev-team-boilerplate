-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVO', 'RETORNADO', 'DADO_DE_BAJA');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('EDUCATIONAL', 'FINANCIAL', 'LEGAL', 'DEPENDANTS');

-- DropForeignKey
ALTER TABLE "turno_assignments" DROP CONSTRAINT "turno_assignments_turnoId_fkey";

-- AlterTable
ALTER TABLE "turno_assignments" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "employee_assets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "assignmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(12,2) NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_assets_tenantId_idx" ON "employee_assets"("tenantId");

-- CreateIndex
CREATE INDEX "employee_assets_employeeId_idx" ON "employee_assets"("employeeId");

-- CreateIndex
CREATE INDEX "employee_assets_tenantId_status_idx" ON "employee_assets"("tenantId", "status");

-- CreateIndex
CREATE INDEX "employee_assets_employeeId_status_idx" ON "employee_assets"("employeeId", "status");

-- CreateIndex
CREATE INDEX "employee_assets_tenantId_type_idx" ON "employee_assets"("tenantId", "type");

-- AddForeignKey
ALTER TABLE "employee_assets" ADD CONSTRAINT "employee_assets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_assignments" ADD CONSTRAINT "turno_assignments_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "supplier_document_versions_tenantId_supplierDocumentId_versionN" RENAME TO "supplier_document_versions_tenantId_supplierDocumentId_vers_key";
