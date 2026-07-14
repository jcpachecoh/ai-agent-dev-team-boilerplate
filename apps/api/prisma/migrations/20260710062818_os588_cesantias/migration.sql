-- OS-588 — Liquidación anual de cesantías e intereses.
-- Migración consolidada (originalmente 5 migraciones separadas por fase de desarrollo,
-- combinadas antes de mergear el PR: employee_compensation_history, backfill,
-- compensation_history_constraints, fund_name_not_blank_check, cesantias_liquidation).
-- El orden de las secciones se conserva igual al de las migraciones originales.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Historial salarial y de fondos de afiliación (tablas)
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "employee_salary_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "salaryType" "SalaryType" NOT NULL,
    "salaryAmount" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_salary_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_fund_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "fundType" "EmployeeCatalogType" NOT NULL,
    "fundName" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_fund_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_salary_history_tenantId_employeeDetailsId_idx" ON "employee_salary_history"("tenantId", "employeeDetailsId");

-- CreateIndex
CREATE INDEX "employee_salary_history_employeeDetailsId_effectiveFrom_idx" ON "employee_salary_history"("employeeDetailsId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "employee_fund_history_tenantId_employeeDetailsId_fundType_idx" ON "employee_fund_history"("tenantId", "employeeDetailsId", "fundType");

-- CreateIndex
CREATE INDEX "employee_fund_history_employeeDetailsId_fundType_effectiveF_idx" ON "employee_fund_history"("employeeDetailsId", "fundType", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "employee_salary_history" ADD CONSTRAINT "employee_salary_history_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_fund_history" ADD CONSTRAINT "employee_fund_history_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill de historial salarial y de fondos para empleados existentes creados
-- antes de que employee_salary_history / employee_fund_history existieran.
--
-- Fecha de vigencia inicial (effectiveFrom): se usa la mejor fecha disponible, en este
-- orden de preferencia: contractStart -> hireDate -> createdAt. contractStart es la fecha
-- en que el contrato (y por tanto el salario/fondo vigente) tomó efecto; hireDate es el
-- respaldo natural cuando contractStart falte; createdAt es el último respaldo para
-- filas legacy sin ninguna de las dos fechas anteriores. Es la misma regla que usa el
-- código de aplicación para nuevos empleados (ver resolveInitialEffectiveDate en
-- apps/api/src/payroll/utils/employee-history-effective-date.util.ts) para no duplicar
-- la lógica entre el backfill y el flujo de creación.
--
-- Alcance: se incluyen TODOS los empleados, incluyendo inactivos y con soft-delete
-- (deletedAt IS NOT NULL). Decisión deliberada: un empleado que se retiró durante el año
-- fiscal igual generó cesantías causadas hasta su fecha de retiro, así que su historial
-- salarial/de fondos debe poder reconstruirse aunque el registro esté con soft-delete.
--
-- Idempotencia: cada INSERT usa NOT EXISTS para no duplicar filas si esta migración
-- llegara a ejecutarse más de una vez sobre el mismo entorno.
-- ─────────────────────────────────────────────────────────────────────────────

-- Backfill: historial salarial (un registro abierto por empleado)
INSERT INTO "employee_salary_history"
  ("id", "tenantId", "employeeDetailsId", "salaryType", "salaryAmount", "effectiveFrom", "effectiveTo", "changedBy", "createdAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  ed."salaryType",
  ed."salaryAmount",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  NULL,
  NULL,
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employee_salary_history" esh WHERE esh."employeeDetailsId" = ed."id"
);

-- Backfill: historial de fondo de cesantías (un registro abierto por empleado)
INSERT INTO "employee_fund_history"
  ("id", "tenantId", "employeeDetailsId", "fundType", "fundName", "effectiveFrom", "effectiveTo", "changedBy", "createdAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  'CESANTIAS_FUND',
  ed."cesantiasFundName",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  NULL,
  NULL,
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employee_fund_history" efh
  WHERE efh."employeeDetailsId" = ed."id" AND efh."fundType" = 'CESANTIAS_FUND'
);

-- Backfill: historial de fondo de pensión (un registro abierto por empleado)
INSERT INTO "employee_fund_history"
  ("id", "tenantId", "employeeDetailsId", "fundType", "fundName", "effectiveFrom", "effectiveTo", "changedBy", "createdAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  'PENSION_FUND',
  ed."pensionFundName",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  NULL,
  NULL,
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employee_fund_history" efh
  WHERE efh."employeeDetailsId" = ed."id" AND efh."fundType" = 'PENSION_FUND'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Constraints — endurece a nivel de base de datos dos invariantes que hasta ahora
-- solo garantizaba el código de aplicación (EmployeeHistoryRepository):
--
-- 1. Rango de vigencia no invertido: effectiveTo, si existe, no puede ser anterior a
--    effectiveFrom. Mismo patrón que "employee_shift_assignments_effective_range_check"
--    (migración 20260706160000_shift_uni_employee_assignment).
-- 2. employee_fund_history.fundType solo admite CESANTIAS_FUND | PENSION_FUND. Prisma no
--    soporta subconjuntos de enum en el schema, así que se restringe con CHECK en vez de
--    dejarlo solamente en el tipo TypeScript de la capa de aplicación (que no protege
--    contra un INSERT hecho fuera del repository). Mismo patrón que
--    "turno_assignments_type_turno_check" (migración 20260703130000_os_582_turno_assignment_type).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "employee_salary_history"
  ADD CONSTRAINT "employee_salary_history_effective_range_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");

ALTER TABLE "employee_fund_history"
  ADD CONSTRAINT "employee_fund_history_effective_range_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");

ALTER TABLE "employee_fund_history"
  ADD CONSTRAINT "employee_fund_history_fund_type_check"
  CHECK ("fundType" IN ('CESANTIAS_FUND', 'PENSION_FUND'));

-- `fundName` no está protegido por NOT NULL contra un string vacío ('' no es NULL). Hoy
-- la única vía de escritura pública (DTOs REST/GraphQL de create/update de empleado) ya
-- rechaza vacíos con @IsNotEmpty(), pero EmployeeHistoryRepository.syncFundHistoryTx no lo
-- revalida por su cuenta — un caller interno futuro que no pase por esos DTOs podría
-- escribir '' sin que nada lo impida. Se cierra en la base de datos, igual que los CHECK
-- anteriores.
ALTER TABLE "employee_fund_history"
  ADD CONSTRAINT "employee_fund_history_fund_name_not_blank_check"
  CHECK (length(trim("fundName")) > 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Liquidación anual de cesantías e intereses.
--
-- Un registro por (employeeId, year). Cesantías e intereses son dos obligaciones legales
-- independientes (la primera se consigna al fondo, la segunda se paga directo al
-- trabajador) — por eso tienen su propio enum de estado en vez de uno combinado. No hay
-- `deletedAt`: igual que EmployeePaymentHistory (el precedente más cercano de un registro
-- financiero legal en este schema), un registro calculado no se borra — se ANULA vía
-- estado. `fundNameSnapshot`/`fundChannelSnapshot` capturan el fondo vigente al cierre del
-- periodo (ver EmployeeFundHistory) y no cambian aunque el empleado cambie de fondo
-- después — la liquidación ya cerrada no se recalcula por eso.
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "CesantiasSettlementStatus" AS ENUM ('CALCULADA', 'CONSIGNADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "CesantiasInterestStatus" AS ENUM ('CALCULADO', 'PAGADO', 'ANULADO');

-- Canal de consignación derivado del nombre del fondo al momento del cálculo (heurística:
-- "Fondo Nacional del Ahorro" → FNA, cualquier otro nombre del catálogo → PRIVATE_OPERATOR).
-- CreateEnum
CREATE TYPE "CesantiasFundChannel" AS ENUM ('FNA', 'PRIVATE_OPERATOR');

-- CreateTable
CREATE TABLE "cesantias_liquidations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "accrualDays" INTEGER NOT NULL,
    "calculationBase" DECIMAL(12,2) NOT NULL,
    "cesantiasAmount" DECIMAL(14,2) NOT NULL,
    "interestAmount" DECIMAL(14,2) NOT NULL,
    "interestRateSnapshot" DECIMAL(6,4) NOT NULL,
    "fundNameSnapshot" TEXT NOT NULL,
    "fundChannelSnapshot" "CesantiasFundChannel" NOT NULL,
    "cesantiasStatus" "CesantiasSettlementStatus" NOT NULL DEFAULT 'CALCULADA',
    "interestStatus" "CesantiasInterestStatus" NOT NULL DEFAULT 'CALCULADO',
    "calculatedBy" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cesantias_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_year_idx" ON "cesantias_liquidations"("tenantId", "year");

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_employeeId_idx" ON "cesantias_liquidations"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_cesantiasStatus_idx" ON "cesantias_liquidations"("tenantId", "cesantiasStatus");

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_interestStatus_idx" ON "cesantias_liquidations"("tenantId", "interestStatus");

-- CreateIndex
CREATE UNIQUE INDEX "cesantias_liquidations_employeeId_year_key" ON "cesantias_liquidations"("employeeId", "year");

-- AddForeignKey
ALTER TABLE "cesantias_liquidations" ADD CONSTRAINT "cesantias_liquidations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
