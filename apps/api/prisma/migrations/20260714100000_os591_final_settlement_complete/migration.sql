-- OS-591 — Workflow completo de liquidación definitiva de contrato.
--
-- Consolida las siguientes 5 migraciones de esta rama (exclusivas de OS-591,
-- jamás aplicadas a ninguna base de datos compartida ni mergeadas a main):
--
--   20260714142642_os591_contract_history_and_prima
--   20260714162602_os591_contract_and_prima_integrity_checks
--   20260714200000_os591_final_settlement
--   20260714214630_os591_final_settlement_workflow
--   20260715024856_os591_final_settlement_payment_fields
--
-- Produce exactamente el mismo esquema final que las 5 migraciones separadas.
-- Ver tasks/OS-591.md para contexto completo (dependencias, alcance, decisiones).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enumeraciones — Historial contractual
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "EmploymentContractStatus" AS ENUM ('ACTIVO', 'TERMINADO');

-- CreateEnum
CREATE TYPE "ContractTerminationReason" AS ENUM ('RENUNCIA', 'JUSTA_CAUSA', 'SIN_JUSTA_CAUSA', 'MUTUO_ACUERDO', 'VENCIMIENTO_TERMINO', 'MUERTE_TRABAJADOR', 'OTRA');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla employment_contracts
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "contractType" "EmployeeContractType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "agreedEndDate" TIMESTAMP(3),
    "status" "EmploymentContractStatus" NOT NULL DEFAULT 'ACTIVO',
    "terminationDate" TIMESTAMP(3),
    "terminationReason" "ContractTerminationReason",
    "terminationNotes" TEXT,
    "activeSlot" BOOLEAN DEFAULT true,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employment_contracts_tenantId_idx" ON "employment_contracts"("tenantId");

-- CreateIndex
CREATE INDEX "employment_contracts_tenantId_employeeDetailsId_idx" ON "employment_contracts"("tenantId", "employeeDetailsId");

-- CreateIndex
CREATE INDEX "employment_contracts_employeeDetailsId_startDate_idx" ON "employment_contracts"("employeeDetailsId", "startDate");

-- CreateIndex
CREATE INDEX "employment_contracts_tenantId_status_idx" ON "employment_contracts"("tenantId", "status");

-- CreateIndex
-- activeSlot es NULL para todo contrato TERMINADO (Postgres no compara NULL <> NULL en un
-- índice único) y `true` únicamente mientras status=ACTIVO — esto hace que este índice se
-- comporte como un "partial unique index": solo puede chocar entre dos filas ACTIVO del
-- mismo empleado, nunca entre TERMINADOs. Ver comentario del modelo en schema.prisma.
CREATE UNIQUE INDEX "employment_contracts_tenantId_employeeDetailsId_activeSlot_key" ON "employment_contracts"("tenantId", "employeeDetailsId", "activeSlot");

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Backfill de historial contractual para empleados existentes creados antes de que
-- employment_contracts existiera.
--
-- Fecha de inicio: misma regla que resolveInitialEffectiveDate (contractStart -> hireDate
-- -> createdAt), reutilizada tal cual del backfill de OS-588 (ver migración
-- 20260710062818_os588_cesantias) para no introducir un criterio distinto.
--
-- Estado: ACTIVO (con activeSlot=true) si isActive=true AND deletedAt IS NULL; en caso
-- contrario TERMINADO. Para las filas que quedan TERMINADO por este backfill (empleados ya
-- inactivos/soft-deleted antes de esta migración) no existe un dato histórico confiable de
-- motivo de terminación, así que se usa terminationReason='OTRA' (heurística explícita, NO
-- un hecho legal — mismo espíritu que la heurística de fundChannelSnapshot en OS-588, ver
-- tasks/OS-588.md) y terminationDate=COALESCE(deletedAt, updatedAt) como mejor aproximación
-- disponible.
--
-- Alcance: TODOS los empleados, incluyendo inactivos y con soft-delete.
-- Idempotencia: NOT EXISTS evita duplicar filas si esta migración se ejecutara más de una vez.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "employment_contracts"
  ("id", "tenantId", "employeeDetailsId", "contractType", "startDate", "agreedEndDate",
   "status", "terminationDate", "terminationReason", "terminationNotes", "activeSlot",
   "changedBy", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  ed."contractType",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  ed."contractEnd",
  CASE WHEN ed."isActive" = true AND ed."deletedAt" IS NULL THEN 'ACTIVO'::"EmploymentContractStatus"
       ELSE 'TERMINADO'::"EmploymentContractStatus" END,
  CASE WHEN ed."isActive" = true AND ed."deletedAt" IS NULL THEN NULL
       ELSE COALESCE(ed."deletedAt", ed."updatedAt") END,
  CASE WHEN ed."isActive" = true AND ed."deletedAt" IS NULL THEN NULL
       ELSE 'OTRA'::"ContractTerminationReason" END,
  CASE WHEN ed."isActive" = true AND ed."deletedAt" IS NULL THEN NULL
       ELSE 'Backfill OS-591: motivo de terminación desconocido (empleado ya inactivo antes de esta migración)' END,
  CASE WHEN ed."isActive" = true AND ed."deletedAt" IS NULL THEN true ELSE NULL END,
  NULL,
  NOW(),
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employment_contracts" ec WHERE ec."employeeDetailsId" = ed."id"
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Constraints employment_contracts (de las 2 primeras migraciones)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "employment_contracts"
  ADD CONSTRAINT "employment_contracts_active_slot_check"
  CHECK (("status" = 'ACTIVO' AND "activeSlot" = true) OR ("status" = 'TERMINADO' AND "activeSlot" IS NULL));

ALTER TABLE "employment_contracts"
  ADD CONSTRAINT "employment_contracts_termination_fields_check"
  CHECK (("status" = 'TERMINADO' AND "terminationDate" IS NOT NULL AND "terminationReason" IS NOT NULL)
      OR ("status" = 'ACTIVO' AND "terminationDate" IS NULL AND "terminationReason" IS NULL));

ALTER TABLE "employment_contracts"
  ADD CONSTRAINT "employment_contracts_agreed_end_after_start_check"
  CHECK ("agreedEndDate" IS NULL OR "agreedEndDate" >= "startDate");

ALTER TABLE "employment_contracts"
  ADD CONSTRAINT "employment_contracts_termination_after_start_check"
  CHECK ("terminationDate" IS NULL OR "terminationDate" >= "startDate");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Enumeraciones — Prima de servicios
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "PrimaHalf" AS ENUM ('PRIMER_SEMESTRE', 'SEGUNDO_SEMESTRE');

-- CreateEnum
CREATE TYPE "PrimaSettlementStatus" AS ENUM ('CALCULADA', 'PAGADA', 'ANULADA');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Tabla prima_liquidations
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "prima_liquidations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "half" "PrimaHalf" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "accrualDays" INTEGER NOT NULL,
    "calculationBase" DECIMAL(12,2) NOT NULL,
    "accruedAmount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "divisorSnapshot" DECIMAL(6,2) NOT NULL,
    "status" "PrimaSettlementStatus" NOT NULL DEFAULT 'CALCULADA',
    "calculatedBy" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prima_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prima_liquidations_tenantId_year_half_idx" ON "prima_liquidations"("tenantId", "year", "half");

-- CreateIndex
CREATE INDEX "prima_liquidations_tenantId_employeeId_idx" ON "prima_liquidations"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "prima_liquidations_tenantId_status_idx" ON "prima_liquidations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "prima_liquidations_employeeId_year_half_key" ON "prima_liquidations"("employeeId", "year", "half");

-- AddForeignKey
ALTER TABLE "prima_liquidations" ADD CONSTRAINT "prima_liquidations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints adicionales (de la migración 20260714162602)
ALTER TABLE "prima_liquidations"
  ADD CONSTRAINT "prima_liquidations_period_range_check"
  CHECK ("periodEnd" >= "periodStart");

ALTER TABLE "prima_liquidations"
  ADD CONSTRAINT "prima_liquidations_paid_amount_non_negative_check"
  CHECK ("paidAmount" >= 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Enumeraciones — Liquidación definitiva
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "FinalSettlementStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'VOIDED');

-- CreateEnum
CREATE TYPE "FinalSettlementMode" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "SettlementLineType" AS ENUM ('DEVENGO', 'DEDUCCION');

-- CreateEnum
CREATE TYPE "SettlementLineOrigin" AS ENUM ('AUTOMATIC', 'MANUAL');

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Tabla final_settlements
-- Incluye directamente todas las columnas de las 5 migraciones originales:
--   · snapshotSmlvThreshold, snapshotNetNegativeAmount  (originalmente via ALTER TABLE)
--   · paymentReference, paymentDate                     (originalmente via ALTER TABLE)
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "final_settlements" (
    "id"                              TEXT NOT NULL,
    "tenantId"                        TEXT NOT NULL,
    "employeeDetailsId"               TEXT NOT NULL,
    "contractId"                      TEXT NOT NULL,

    "effectiveTerminationDate"        DATE NOT NULL,
    "terminationReason"               "ContractTerminationReason" NOT NULL,
    "status"                          "FinalSettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "mode"                            "FinalSettlementMode"   NOT NULL DEFAULT 'AUTOMATIC',

    -- Contract snapshot
    "snapshotContractType"            "EmployeeContractType" NOT NULL,
    "snapshotContractStartDate"       DATE NOT NULL,
    "snapshotAgreedEndDate"           DATE,

    -- Salary snapshot
    "snapshotSalaryType"              "SalaryType" NOT NULL,
    "snapshotSalaryAmount"            DECIMAL(14,2) NOT NULL,

    -- Legal parameters snapshot (vigentes a effectiveTerminationDate)
    "snapshotSmlvAmount"              DECIMAL(14,2) NOT NULL,
    "snapshotTransportSubsidyAmount"  DECIMAL(14,2) NOT NULL,
    "snapshotFormulaVersion"          INTEGER NOT NULL,
    -- Umbral de SMLMV vigente al calcular (ej: 10.00 = 10 SMLMV). Permite auditar
    -- retroactivamente qué tabla se aplicó (INDEFINIDO_BAJO vs INDEFINIDO_ALTO).
    "snapshotSmlvThreshold"           DECIMAL(6,2) NOT NULL DEFAULT 10,

    -- Variable average snapshot (0 si no existe historial de pagos variables)
    "snapshotVariableAvgMonthsCovered" INTEGER NOT NULL DEFAULT 0,
    "snapshotVariableAvgTotal"         DECIMAL(14,2) NOT NULL DEFAULT 0,
    "snapshotVariableAvgMonthly"       DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Financial totals
    "grossDevengados"                 DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDeducciones"                DECIMAL(14,2) NOT NULL DEFAULT 0,
    -- netAmount = max(0, grossDevengados - totalDeducciones).
    -- Cuando es negativo: netAmount=0 y snapshotNetNegativeAmount guarda el déficit.
    "netAmount"                       DECIMAL(14,2) NOT NULL DEFAULT 0,
    -- Saldo a cargo del empleado (≥ 0). 0.00 si grossDevengados ≥ totalDeducciones.
    "snapshotNetNegativeAmount"       DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Manual liquidation fields (obligatorios cuando mode=MANUAL)
    "manualJustification"             TEXT,
    "manualReference"                 TEXT,
    "manualResponsible"               TEXT,

    -- Payment fields (OS-591 fase 3)
    "paymentReference"                TEXT,
    "paymentDate"                     DATE,

    -- Audit & warnings
    "acceptedWarnings"                JSONB NOT NULL DEFAULT '[]',
    "auditTrail"                      JSONB NOT NULL DEFAULT '[]',

    -- Timestamps y actores
    "createdBy"                       TEXT,
    "calculatedBy"                    TEXT,
    "calculatedAt"                    TIMESTAMP(3),
    "approvedBy"                      TEXT,
    "approvedAt"                      TIMESTAMP(3),
    "paidBy"                          TEXT,
    "paidAt"                          TIMESTAMP(3),
    "voidedBy"                        TEXT,
    "voidedAt"                        TIMESTAMP(3),
    "voidReason"                      TEXT,

    "createdAt"                       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "final_settlements_tenantId_idx" ON "final_settlements"("tenantId");

-- CreateIndex
CREATE INDEX "final_settlements_tenantId_employeeDetailsId_idx" ON "final_settlements"("tenantId", "employeeDetailsId");

-- CreateIndex
CREATE INDEX "final_settlements_tenantId_status_idx" ON "final_settlements"("tenantId", "status");

-- CreateIndex
CREATE INDEX "final_settlements_contractId_idx" ON "final_settlements"("contractId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Tabla settlement_lines
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "settlement_lines" (
    "id"                   TEXT NOT NULL,
    "tenantId"             TEXT NOT NULL,
    "settlementId"         TEXT NOT NULL,

    "code"                 TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "type"                 "SettlementLineType" NOT NULL,
    "origin"               "SettlementLineOrigin" NOT NULL DEFAULT 'AUTOMATIC',

    "sourceReference"      TEXT,

    "baseAmount"           DECIMAL(14,2),
    "quantity"             DECIMAL(10,4),
    "rate"                 DECIMAL(10,6),
    "amount"               DECIMAL(14,2) NOT NULL,

    "metadata"             JSONB NOT NULL DEFAULT '{}',
    "manualJustification"  TEXT,

    "sortOrder"            INTEGER NOT NULL DEFAULT 0,

    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "settlement_lines_tenantId_settlementId_idx" ON "settlement_lines"("tenantId", "settlementId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Foreign keys — final_settlements y settlement_lines
-- ─────────────────────────────────────────────────────────────────────────────

-- AddForeignKey
ALTER TABLE "final_settlements"
    ADD CONSTRAINT "final_settlements_employeeDetailsId_fkey"
    FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_settlements"
    ADD CONSTRAINT "final_settlements_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "employment_contracts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_lines"
    ADD CONSTRAINT "settlement_lines_settlementId_fkey"
    FOREIGN KEY ("settlementId") REFERENCES "final_settlements"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Constraints final_settlements y settlement_lines
-- ─────────────────────────────────────────────────────────────────────────────

-- netAmount nunca negativo — el motor lo congela en 0 con advertencia antes de
-- llegar a la base de datos, pero se refuerza aquí como red de seguridad.
ALTER TABLE "final_settlements"
    ADD CONSTRAINT "final_settlements_net_not_negative_check"
    CHECK ("netAmount" >= 0);

ALTER TABLE "final_settlements"
    ADD CONSTRAINT "final_settlements_gross_not_negative_check"
    CHECK ("grossDevengados" >= 0);

ALTER TABLE "final_settlements"
    ADD CONSTRAINT "final_settlements_deductions_not_negative_check"
    CHECK ("totalDeducciones" >= 0);

ALTER TABLE "final_settlements"
    ADD CONSTRAINT "final_settlements_net_negative_amount_not_negative_check"
    CHECK ("snapshotNetNegativeAmount" >= 0);

-- amount en líneas nunca negativo — el signo está implícito en el `type`
-- (DEVENGO positivo, DEDUCCION negativo al sumar). Almacenar siempre positivo
-- evita doble contabilidad.
ALTER TABLE "settlement_lines"
    ADD CONSTRAINT "settlement_lines_amount_not_negative_check"
    CHECK ("amount" >= 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Invariante DB: un solo asentamiento activo por contrato.
--
-- Índice único parcial de PostgreSQL: excluye filas con status = 'VOIDED' para
-- permitir múltiples liquidaciones anuladas del mismo contrato mientras garantiza
-- que nunca coexistan dos liquidaciones DRAFT/CALCULATED/APPROVED/PAID.
-- Complementa (no reemplaza) la validación en FinalSettlementRepository.create().
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "final_settlements_active_per_contract_key"
    ON "final_settlements" ("tenantId", "contractId")
    WHERE "status" != 'VOIDED';

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. Tabla indemnification_formula_validations
-- OS-591 (fase 3) — Constancia legal de que una versión de INDEMNIZACION_FORMULA_VERSION
-- fue revisada/validada por el equipo legal. Revalidar desactiva la anterior y crea fila nueva.
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "indemnification_formula_validations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "formulaVersion" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legalReference" TEXT NOT NULL,
    "observations" TEXT,
    "validatedBy" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indemnification_formula_validations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indemnification_formula_validations_tenantId_idx" ON "indemnification_formula_validations"("tenantId");

-- CreateIndex
CREATE INDEX "indemnification_formula_validations_tenantId_formulaVersion_idx" ON "indemnification_formula_validations"("tenantId", "formulaVersion");

-- Invariante: solo una validación legal ACTIVA por (tenantId, formulaVersion).
CREATE UNIQUE INDEX "indemnification_formula_validations_active_version_key"
  ON "indemnification_formula_validations"("tenantId", "formulaVersion")
  WHERE "isActive" = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. Tabla pending_salary_reconciliations
-- OS-591 (fase 3) — Constancia auditable de que un actor humano revisó pagos previos
-- antes de aprobar una liquidación con tramo de salario pendiente (SAL_PENDIENTE).
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "pending_salary_reconciliations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "previouslyPaidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentReference" TEXT,
    "paymentDate" TIMESTAMP(3),
    "responsible" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "recognizedBalance" DECIMAL(14,2) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_salary_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_salary_reconciliations_settlementId_key" ON "pending_salary_reconciliations"("settlementId");

-- CreateIndex
CREATE INDEX "pending_salary_reconciliations_tenantId_idx" ON "pending_salary_reconciliations"("tenantId");

-- AddForeignKey
ALTER TABLE "pending_salary_reconciliations" ADD CONSTRAINT "pending_salary_reconciliations_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "final_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Montos de reconciliación nunca negativos.
ALTER TABLE "pending_salary_reconciliations"
  ADD CONSTRAINT "pending_salary_reconciliations_previouslyPaidAmount_check" CHECK ("previouslyPaidAmount" >= 0),
  ADD CONSTRAINT "pending_salary_reconciliations_recognizedBalance_check" CHECK ("recognizedBalance" >= 0);
