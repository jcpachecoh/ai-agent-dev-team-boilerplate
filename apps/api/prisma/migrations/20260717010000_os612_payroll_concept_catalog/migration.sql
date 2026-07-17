-- OS-612 — catálogo de conceptos de nómina + FK nullable SettlementLine.conceptId.
-- Backfill best-effort por code exacto vs GLOBAL activo (no modifica code/name históricos).
-- En deploys greenfield el seed re-aplica el mismo criterio de backfill.

CREATE TYPE "PayrollConceptLineNature" AS ENUM ('DEVENGO', 'DEDUCCION', 'APORTE_PATRONAL', 'INFORMATIVO');

CREATE TABLE "payroll_concepts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantScope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "lineNature" "PayrollConceptLineNature" NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_concepts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payroll_concepts_tenantScope_code_key" ON "payroll_concepts"("tenantScope", "code");

CREATE INDEX "payroll_concepts_tenantScope_code_deletedAt_idx" ON "payroll_concepts"("tenantScope", "code", "deletedAt");

CREATE INDEX "payroll_concepts_deletedAt_idx" ON "payroll_concepts"("deletedAt");

ALTER TABLE "settlement_lines" ADD COLUMN "conceptId" TEXT;

CREATE INDEX "settlement_lines_conceptId_idx" ON "settlement_lines"("conceptId");

ALTER TABLE "settlement_lines"
  ADD CONSTRAINT "settlement_lines_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "payroll_concepts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Best-effort: solo enlaza si ya existen conceptos GLOBAL (p. ej. seed previo o re-deploy).
-- Greenfield típico: 0 filas aquí; el seed vuelve a ejecutar el mismo UPDATE.
UPDATE "settlement_lines" AS sl
SET "conceptId" = pc.id
FROM "payroll_concepts" AS pc
WHERE pc."tenantScope" = 'GLOBAL'
  AND pc."deletedAt" IS NULL
  AND pc."code" = sl."code"
  AND sl."conceptId" IS NULL;
