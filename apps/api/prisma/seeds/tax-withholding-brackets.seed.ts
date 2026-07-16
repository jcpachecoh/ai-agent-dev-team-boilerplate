import { PrismaClient } from '@prisma/client';

import { GLOBAL_TENANT_SCOPE } from '../../src/labor-legal-parameters/labor-legal-parameters.constants';
import {
  OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277,
  PROVISIONAL_TAX_WITHHOLDING_VALID_FROM,
} from '../../src/tax-withholding-brackets/tax-withholding-brackets.constants';

type BracketVigenciaSeed = {
  validFrom: string;
  validTo: string | null;
  source: string;
};

/**
 * Vigencia global de la tabla Ley 2277/2022 — OS-594.
 *
 * DECISIÓN BLOQUEADA: el repositorio no contiene la fecha legal exacta de entrada en vigencia
 * de la tabla progresiva. El valor provisional coincide con task-04 §4.2 (contexto 2025) y la
 * vigencia UVT sembrada (2025-01-01). Períodos anteriores → NotFoundException en reporte.
 */
const BRACKET_VIGENCIAS: BracketVigenciaSeed[] = [
  {
    validFrom: PROVISIONAL_TAX_WITHHOLDING_VALID_FROM,
    validTo: null,
    source:
      'Ley 2277 de 2022 — tabla mensual retención salarios (task-04 §4.2); vigencia provisional OS-594',
  },
];

export async function seedTaxWithholdingBrackets(prisma: PrismaClient): Promise<void> {
  let count = 0;

  for (const vigencia of BRACKET_VIGENCIAS) {
    const validFrom = new Date(`${vigencia.validFrom}T00:00:00.000Z`);
    const validTo = vigencia.validTo ? new Date(`${vigencia.validTo}T23:59:59.999Z`) : null;

    for (const bracket of OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277) {
      await prisma.taxWithholdingBracket.upsert({
        where: {
          tenantScope_validFrom_sortOrder: {
            tenantScope: GLOBAL_TENANT_SCOPE,
            validFrom,
            sortOrder: bracket.sortOrder,
          },
        },
        update: {
          lowerUvtBound: bracket.lowerUvtBound,
          upperUvtBound: bracket.upperUvtBound,
          marginalRate: bracket.marginalRate,
          fixedTaxUvt: bracket.fixedTaxUvt,
          validTo,
          source: vigencia.source,
        },
        create: {
          tenantId: null,
          tenantScope: GLOBAL_TENANT_SCOPE,
          sortOrder: bracket.sortOrder,
          lowerUvtBound: bracket.lowerUvtBound,
          upperUvtBound: bracket.upperUvtBound,
          marginalRate: bracket.marginalRate,
          fixedTaxUvt: bracket.fixedTaxUvt,
          validFrom,
          validTo,
          source: vigencia.source,
        },
      });
      count++;
    }
  }

  console.log(`Tax withholding brackets seeded: ${count} tramos (global)`);
}
