-- OS-595 Fase 1 — datos maestros PILA (sin PilaPeriodExport ni export).
-- Campos nuevos opcionales para no romper tenants existentes.
-- No se inventan códigos regulatorios en backfill de filas históricas.

-- Tenant: dígito de verificación separado del NIT
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "verificationDigit" TEXT;

-- Location: DIVIPOLA de sede laboral (EmployeeDetails.locationId)
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "departmentCode" VARCHAR(2);
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "municipalityCode" VARCHAR(3);

-- Catálogo: código PILA oficial (nullable; AREA/DEPARTMENT/CESANTIAS_FUND quedan null)
ALTER TABLE "employee_catalog_options" ADD COLUMN IF NOT EXISTS "pilaCode" VARCHAR(10);

-- Unique tenant+type+pilaCode (múltiples NULL permitidos en PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS "employee_catalog_options_tenantId_type_pilaCode_key"
  ON "employee_catalog_options" ("tenantId", "type", "pilaCode");

-- Configuración PILA del aportante (1:1 Tenant)
CREATE TABLE IF NOT EXISTS "tenant_pila_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentType" VARCHAR(2) NOT NULL DEFAULT 'NI',
    "claseAportante" VARCHAR(1) NOT NULL DEFAULT 'B',
    "naturalezaJuridica" VARCHAR(1) NOT NULL DEFAULT '2',
    "formaPresentacion" VARCHAR(1) NOT NULL DEFAULT 'U',
    "tipoAportante" VARCHAR(2) NOT NULL DEFAULT '01',
    "arlCode" VARCHAR(10),
    "actividadEconomicaArl" VARCHAR(7),
    "exemptFromHealthSenaIcbfLey1607" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pila_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_pila_configs_tenantId_key"
  ON "tenant_pila_configs"("tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_pila_configs_tenantId_fkey'
  ) THEN
    ALTER TABLE "tenant_pila_configs"
      ADD CONSTRAINT "tenant_pila_configs_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
