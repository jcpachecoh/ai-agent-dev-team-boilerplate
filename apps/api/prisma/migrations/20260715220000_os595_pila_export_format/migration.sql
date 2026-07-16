-- OS-595 — multi-formato PILA (TXT | XLSX) con versionado independiente.

-- 1) Enum + columna (default TXT para filas existentes)
CREATE TYPE "PilaExportFormat" AS ENUM ('TXT', 'XLSX');

ALTER TABLE "pila_period_exports"
  ADD COLUMN "format" "PilaExportFormat" NOT NULL DEFAULT 'TXT';

-- 2) Reemplazar unique de versión (antes por período; ahora por período+formato)
ALTER TABLE "pila_period_exports"
  DROP CONSTRAINT IF EXISTS "pila_period_exports_tenantId_periodHealth_version_key";

CREATE UNIQUE INDEX "pila_period_exports_tenant_period_format_version_key"
  ON "pila_period_exports"("tenantId", "periodHealth", "format", "version");

-- 3) Unique parcial: una activa (GENERATED|PAID) por período y formato
DROP INDEX IF EXISTS "pila_period_exports_one_active_per_period";

CREATE UNIQUE INDEX "pila_period_exports_one_active_per_period_format"
  ON "pila_period_exports"("tenantId", "periodHealth", "format")
  WHERE "status" IN ('GENERATED', 'PAID');

CREATE INDEX "pila_period_exports_tenant_period_format_idx"
  ON "pila_period_exports"("tenantId", "periodHealth", "format");
