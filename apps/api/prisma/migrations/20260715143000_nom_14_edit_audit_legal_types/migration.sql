-- NOM-14 task 12: edición, auditoría, autoSolicitable, isEditable

ALTER TABLE "payroll_novedades" ADD COLUMN "isEditable" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "novedad_type_configs" ADD COLUMN "autoSolicitable" BOOLEAN NOT NULL DEFAULT true;

UPDATE "novedad_type_configs"
SET "autoSolicitable" = false
WHERE "type" = 'CALAMIDAD_DOMESTICA';

CREATE TABLE "novedad_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "novedadId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousValue" JSONB NOT NULL,
    "newValue" JSONB NOT NULL,

    CONSTRAINT "novedad_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "novedad_audit_logs_tenantId_idx" ON "novedad_audit_logs"("tenantId");
CREATE INDEX "novedad_audit_logs_novedadId_idx" ON "novedad_audit_logs"("novedadId");
CREATE INDEX "novedad_audit_logs_changedAt_idx" ON "novedad_audit_logs"("changedAt");

ALTER TABLE "novedad_audit_logs" ADD CONSTRAINT "novedad_audit_logs_novedadId_fkey" FOREIGN KEY ("novedadId") REFERENCES "payroll_novedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
