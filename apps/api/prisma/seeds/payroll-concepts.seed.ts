import type { PrismaClient } from '@prisma/client';

import {
  GLOBAL_TENANT_SCOPE,
  PAYROLL_CONCEPT_DEFINITIONS,
} from '../../src/shared/payroll/payroll-concepts.registry';

/**
 * OS-612 PR1 — seed GLOBAL idempotente derivado del registry TypeScript.
 *
 * - Upsert por `(tenantScope, code)` — sin IDs hardcodeados.
 * - Actualiza `displayName` / `lineNature` del GLOBAL desde el registry.
 * - **No** toca `deletedAt` (preserva desactivaciones GLOBAL).
 * - **No** crea ni modifica overrides de tenant.
 */
export async function seedPayrollConcepts(prisma: PrismaClient): Promise<void> {
  let upserted = 0;

  for (const def of PAYROLL_CONCEPT_DEFINITIONS) {
    await prisma.payrollConcept.upsert({
      where: {
        tenantScope_code: {
          tenantScope: GLOBAL_TENANT_SCOPE,
          code: def.code,
        },
      },
      update: {
        displayName: def.displayName,
        lineNature: def.lineNature,
        // deletedAt intencionalmente omitido — re-seed no reactiva ni borra
      },
      create: {
        tenantId: null,
        tenantScope: GLOBAL_TENANT_SCOPE,
        code: def.code,
        displayName: def.displayName,
        lineNature: def.lineNature,
      },
    });
    upserted += 1;
  }

  // Backfill forward-compatible: enlaza settlement_lines huérfanas por code exacto GLOBAL.
  // No toca code/name. Idempotente (solo WHERE conceptId IS NULL).
  const backfill = await prisma.$executeRaw`
    UPDATE "settlement_lines" AS sl
    SET "conceptId" = pc.id
    FROM "payroll_concepts" AS pc
    WHERE pc."tenantScope" = ${GLOBAL_TENANT_SCOPE}
      AND pc."deletedAt" IS NULL
      AND pc."code" = sl."code"
      AND sl."conceptId" IS NULL
  `;

  console.log(
    `Payroll concepts seeded: ${upserted} GLOBAL rows (from registry); ` +
      `settlement_lines backfill rows touched: ${String(backfill)}`,
  );
}
