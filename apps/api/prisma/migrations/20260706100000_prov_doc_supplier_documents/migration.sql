-- AlterEnum
ALTER TYPE "StorageDomain" ADD VALUE 'SUPPLIERS';

-- CreateEnum
CREATE TYPE "SupplierDocumentType" AS ENUM (
  'RUT',
  'CAMARA_COMERCIO',
  'CEDULA_REPRESENTANTE_LEGAL',
  'CERTIFICACION_BANCARIA',
  'LISTA_PRECIOS',
  'CONTRATO_COMERCIAL',
  'POLIZAS',
  'CERTIFICACION_SANITARIA',
  'CONCEPTO_SANITARIO_INVIMA',
  'FICHA_TECNICA_PRODUCTO',
  'HOJA_SEGURIDAD',
  'CERTIFICADO_BPM',
  'ACUERDO_CONFIDENCIALIDAD',
  'TRATAMIENTO_DATOS_PERSONALES'
);

-- CreateEnum
CREATE TYPE "SupplierDocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'EXPIRING', 'EXPIRED');

-- AlterTable
ALTER TABLE "suppliers"
ADD COLUMN "isCritical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sellsRecurrentProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isFoodSupplier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "handlesChemicals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isRawMaterialSupplier" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "supplier_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "documentType" "SupplierDocumentType" NOT NULL,
    "status" "SupplierDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" DATE,
    "expiresAt" DATE,
    "lastUploadedAt" TIMESTAMP(3),
    "uploadedByUserId" TEXT,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_document_versions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierDocumentId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "uploadedByUserId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_document_policies" (
    "tenantId" TEXT NOT NULL,
    "camaraComercioValidityDays" INTEGER NOT NULL DEFAULT 30,
    "rutAnnualReviewMonths" INTEGER NOT NULL DEFAULT 11,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_document_policies_pkey" PRIMARY KEY ("tenantId")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_documents_currentVersionId_key" ON "supplier_documents"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_documents_tenantId_supplierId_documentType_key"
ON "supplier_documents"("tenantId", "supplierId", "documentType");

-- CreateIndex
CREATE INDEX "supplier_documents_tenantId_supplierId_idx" ON "supplier_documents"("tenantId", "supplierId");

-- CreateIndex
CREATE INDEX "supplier_documents_tenantId_expiresAt_idx" ON "supplier_documents"("tenantId", "expiresAt");

-- CreateIndex
CREATE INDEX "supplier_documents_tenantId_status_idx" ON "supplier_documents"("tenantId", "status");

-- CreateIndex
CREATE INDEX "supplier_documents_tenantId_deletedAt_idx" ON "supplier_documents"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_document_versions_tenantId_supplierDocumentId_versionNumber_key"
ON "supplier_document_versions"("tenantId", "supplierDocumentId", "versionNumber");

-- CreateIndex
CREATE INDEX "supplier_document_versions_tenantId_supplierDocumentId_idx"
ON "supplier_document_versions"("tenantId", "supplierDocumentId");

-- CreateIndex
CREATE INDEX "supplier_document_versions_tenantId_uploadedAt_idx"
ON "supplier_document_versions"("tenantId", "uploadedAt");

-- CreateIndex
CREATE INDEX "supplier_document_versions_tenantId_deletedAt_idx"
ON "supplier_document_versions"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "supplier_documents"
ADD CONSTRAINT "supplier_documents_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_documents"
ADD CONSTRAINT "supplier_documents_uploadedByUserId_fkey"
FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_documents"
ADD CONSTRAINT "supplier_documents_currentVersionId_fkey"
FOREIGN KEY ("currentVersionId") REFERENCES "supplier_document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_document_versions"
ADD CONSTRAINT "supplier_document_versions_supplierDocumentId_fkey"
FOREIGN KEY ("supplierDocumentId") REFERENCES "supplier_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_document_versions"
ADD CONSTRAINT "supplier_document_versions_storageObjectId_fkey"
FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_document_versions"
ADD CONSTRAINT "supplier_document_versions_uploadedByUserId_fkey"
FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
