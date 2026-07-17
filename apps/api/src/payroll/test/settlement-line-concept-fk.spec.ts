import { readFileSync } from 'fs';
import { join } from 'path';

import {
  GLOBAL_TENANT_SCOPE,
  isPayrollConceptCode,
  listPayrollConceptCodes,
} from '../payroll-concepts.constants';

/**
 * OS-612 Fase 3 — contrato de migración FK + política de backfill.
 * No ejecuta SQL contra DB real; valida el artefacto de migración y reglas congeladas.
 */
describe('SettlementLine.conceptId FK + backfill (OS-612 Fase 3)', (): void => {
  const migrationSql = readFileSync(
    join(
      __dirname,
      '../../../prisma/migrations/20260717010000_os612_payroll_concept_catalog/migration.sql',
    ),
    'utf8',
  );

  it('migración agrega conceptId nullable + FK SetNull + índice', (): void => {
    expect(migrationSql).toContain('ADD COLUMN "conceptId" TEXT');
    expect(migrationSql).toContain('settlement_lines_conceptId_idx');
    expect(migrationSql).toContain('REFERENCES "payroll_concepts"("id")');
    expect(migrationSql).toContain('ON DELETE SET NULL');
  });

  it('backfill solo actualiza conceptId por code exacto GLOBAL activo', (): void => {
    expect(migrationSql).toContain('SET "conceptId" = pc.id');
    expect(migrationSql).toContain(`pc."tenantScope" = 'GLOBAL'`);
    expect(migrationSql).toContain('pc."deletedAt" IS NULL');
    expect(migrationSql).toContain('pc."code" = sl."code"');
    expect(migrationSql).toContain('sl."conceptId" IS NULL');
    // No reescribe snapshots históricos
    expect(migrationSql).not.toMatch(/SET\s+"code"\s*=/i);
    expect(migrationSql).not.toMatch(/SET\s+"name"\s*=/i);
    expect(migrationSql).not.toMatch(/sl\."name"/);
  });

  it('códigos OS-591 automáticos son catalogables (backfill viable)', (): void => {
    for (const code of [
      'SAL_PENDIENTE',
      'CESANTIAS',
      'INTERESES_CESANTIAS',
      'PRIMA',
      'VACACIONES',
      'INDEMNIZACION',
      'AJUSTE_MANUAL',
    ]) {
      expect(isPayrollConceptCode(code)).toBe(true);
    }
    expect(listPayrollConceptCodes().length).toBeGreaterThanOrEqual(22);
    expect(GLOBAL_TENANT_SCOPE).toBe('GLOBAL');
  });

  it('filas que pueden quedar sin conceptId tras backfill best-effort', (): void => {
    // Documenta el contrato: no se inventan matches por name ni aliases.
    const remainNullReasons = [
      'code libre / inventado en línea MANUAL histórica',
      'code tipográfico distinto al registry (sin alias)',
      'concepto GLOBAL soft-deleted al momento del backfill',
      'línea ya enlazada (conceptId IS NOT NULL) — no se reescribe',
    ] as const;
    expect(remainNullReasons.length).toBe(4);
  });
});
