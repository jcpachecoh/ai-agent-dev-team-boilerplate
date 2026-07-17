-- OS-606 / CONN-04b — solicitud administrativa de extensión de jornada.
-- Extiende overtime_requests + EmployeeCatalogType.OVERTIME_REASON.
-- No toca datos existentes de DETECCION_AUTOMATICA (solo vuelve nullable columnas de detección).

-- 1) Enum catálogo: motivo de HE administrativa
ALTER TYPE "EmployeeCatalogType" ADD VALUE IF NOT EXISTS 'OVERTIME_REASON';

-- 2) Campos de ventana / trazabilidad (nullable → filas DETECCION_AUTOMATICA intactas)
ALTER TABLE "overtime_requests"
  ADD COLUMN IF NOT EXISTS "workDate" DATE,
  ADD COLUMN IF NOT EXISTS "proposedStartTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proposedEndTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proposedMinutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "reasonOptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "requestedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "batchId" TEXT;

-- 3) Detección: columnas opcionales para filas SOLICITUD_ADMINISTRATIVA (valores existentes se conservan)
ALTER TABLE "overtime_requests"
  ALTER COLUMN "shiftEndTime" DROP NOT NULL,
  ALTER COLUMN "actualEndTime" DROP NOT NULL,
  ALTER COLUMN "accumulatedMinutes" DROP NOT NULL;

-- 4) Reemplazar unique mensual global (bloqueaba varias admin en el mismo mes)
-- Nombre Prisma histórico: overtime_requests_tenantId_employeeId_locationId_payrollPer_key
DROP INDEX IF EXISTS "overtime_requests_tenantId_employeeId_locationId_payrollPer_key";
ALTER TABLE "overtime_requests"
  DROP CONSTRAINT IF EXISTS "overtime_requests_tenantId_employeeId_locationId_payrollPer_key";

-- 5) Uniques parciales (Prisma no las declara en schema.prisma — ver comentario en modelo OvertimeRequest)
-- DETECCION_AUTOMATICA: una activa por empleado/sede/período de nómina (idempotencia CONN-04a)
CREATE UNIQUE INDEX "overtime_requests_auto_period_active_key"
  ON "overtime_requests" ("tenantId", "employeeId", "locationId", "payrollPeriod")
  WHERE "type" = 'DETECCION_AUTOMATICA' AND "deletedAt" IS NULL;

-- SOLICITUD_ADMINISTRATIVA: duplicado equivalente = misma ventana (workDate + proposed start/end).
-- Varias ventanas distintas el mismo día están permitidas.
-- status <> OBJETADA: una fila terminal OBJETADA no bloquea re-solicitud de la misma ventana
-- (P5 / task-03 puede añadir reglas de negocio adicionales sobre pendientes/aprobadas).
-- reasonOptionId NO forma parte de la identidad (mismo motivo distinto ≠ misma ventana).
CREATE UNIQUE INDEX "overtime_requests_admin_window_active_key"
  ON "overtime_requests" (
    "tenantId",
    "employeeId",
    "locationId",
    "workDate",
    "proposedStartTime",
    "proposedEndTime",
    "type"
  )
  WHERE "type" = 'SOLICITUD_ADMINISTRATIVA'
    AND "deletedAt" IS NULL
    AND "status" <> 'OBJETADA';

-- 6) Índices de consulta
CREATE INDEX IF NOT EXISTS "overtime_requests_tenantId_workDate_idx"
  ON "overtime_requests" ("tenantId", "workDate");

CREATE INDEX IF NOT EXISTS "overtime_requests_tenantId_batchId_idx"
  ON "overtime_requests" ("tenantId", "batchId");

CREATE INDEX IF NOT EXISTS "overtime_requests_tenantId_type_status_idx"
  ON "overtime_requests" ("tenantId", "type", "status");

CREATE INDEX IF NOT EXISTS "overtime_requests_reasonOptionId_idx"
  ON "overtime_requests" ("reasonOptionId");

CREATE INDEX IF NOT EXISTS "overtime_requests_requestedByUserId_idx"
  ON "overtime_requests" ("requestedByUserId");

-- 7) FKs — Restrict: motivo desactivado (isActive) conserva historial; solicitante no cascada borrado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'overtime_requests_reasonOptionId_fkey'
  ) THEN
    ALTER TABLE "overtime_requests"
      ADD CONSTRAINT "overtime_requests_reasonOptionId_fkey"
      FOREIGN KEY ("reasonOptionId") REFERENCES "employee_catalog_options"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'overtime_requests_requestedByUserId_fkey'
  ) THEN
    ALTER TABLE "overtime_requests"
      ADD CONSTRAINT "overtime_requests_requestedByUserId_fkey"
      FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
