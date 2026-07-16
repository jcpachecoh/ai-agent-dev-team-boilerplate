-- OS-595 Fase 4 — PilaPeriodExport + estados + índices de versionado.
-- No incluye PENDING/VALIDATION_FAILED (solo exportaciones con archivo).

CREATE TYPE "PilaPeriodExportStatus" AS ENUM ('GENERATED', 'PAID', 'VOIDED');

CREATE TABLE "pila_period_exports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodHealth" VARCHAR(7) NOT NULL,
    "periodOther" VARCHAR(7) NOT NULL,
    "status" "PilaPeriodExportStatus" NOT NULL,
    "version" INTEGER NOT NULL,
    "technicalVersion" VARCHAR(32) NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileChecksum" TEXT NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "totalPayrollAmount" INTEGER NOT NULL,
    "totalContribution" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paidConfirmedBy" TEXT,
    "planNumber" TEXT,
    "paymentReference" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pila_period_exports_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pila_period_exports"
    ADD CONSTRAINT "pila_period_exports_version_positive"
    CHECK ("version" > 0);

CREATE UNIQUE INDEX "pila_period_exports_storageObjectId_key"
    ON "pila_period_exports"("storageObjectId");

CREATE UNIQUE INDEX "pila_period_exports_tenantId_periodHealth_version_key"
    ON "pila_period_exports"("tenantId", "periodHealth", "version");

-- Una sola versión activa (no anulada) por tenant + período salud.
CREATE UNIQUE INDEX "pila_period_exports_one_active_per_period"
    ON "pila_period_exports"("tenantId", "periodHealth")
    WHERE "status" IN ('GENERATED', 'PAID');

CREATE INDEX "pila_period_exports_tenantId_periodHealth_idx"
    ON "pila_period_exports"("tenantId", "periodHealth");

CREATE INDEX "pila_period_exports_tenantId_status_idx"
    ON "pila_period_exports"("tenantId", "status");

CREATE INDEX "pila_period_exports_tenantId_periodHealth_status_idx"
    ON "pila_period_exports"("tenantId", "periodHealth", "status");

ALTER TABLE "pila_period_exports"
    ADD CONSTRAINT "pila_period_exports_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pila_period_exports"
    ADD CONSTRAINT "pila_period_exports_storageObjectId_fkey"
    FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
