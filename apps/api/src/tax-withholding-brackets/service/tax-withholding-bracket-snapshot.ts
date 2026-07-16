import { NotFoundException } from '@nestjs/common';
import type { TaxWithholdingBracket } from '@prisma/client';

import type { ResolvedTaxWithholdingBracket } from '../interfaces/tax-withholding-brackets.interfaces';
import {
  mapToResolvedTaxWithholdingBracket,
  validateTaxWithholdingBracketSet,
} from '../utils/validate-tax-withholding-bracket-set';

/**
 * Resolver en memoria sobre filas precargadas de TaxWithholdingBracket.
 * Construido una vez por corrida de reporte vía TaxWithholdingBracketsService.preload().
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class TaxWithholdingBracketSnapshot {
  private readonly rowsByVigencia = new Map<string, TaxWithholdingBracket[]>();

  constructor(
    rows: TaxWithholdingBracket[],
    private readonly tenantId: string | null,
  ) {
    for (const row of rows) {
      const key = vigenciaKey(row.tenantScope, row.validFrom);
      const list = this.rowsByVigencia.get(key) ?? [];
      list.push(row);
      this.rowsByVigencia.set(key, list);
    }
  }

  /** Devuelve los tramos validados vigentes en `date` — tenant override primero, luego global. */
  bracketsAt(date: Date): ResolvedTaxWithholdingBracket[] {
    if (this.tenantId) {
      const tenantRows = this.findActiveVigenciaRows(this.tenantId, date);
      if (tenantRows.length > 0) {
        return this.resolveValidated(tenantRows);
      }
    }

    const globalRows = this.findActiveVigenciaRows('GLOBAL', date);
    if (globalRows.length > 0) {
      return this.resolveValidated(globalRows);
    }

    throw new NotFoundException(
      `No existe tabla de retención en la fuente vigente para la fecha ${date.toISOString().slice(0, 10)}`,
    );
  }

  private findActiveVigenciaRows(tenantScope: string, date: Date): TaxWithholdingBracket[] {
    const activeVigencias = [...this.rowsByVigencia.entries()]
      .filter(
        ([key, rows]: [string, TaxWithholdingBracket[]]): boolean =>
          key.startsWith(`${tenantScope}:`) && rows.some((r): boolean => isActiveAt(r, date)),
      )
      .map(([key]: [string, TaxWithholdingBracket[]]): string => key);

    if (activeVigencias.length === 0) {
      return [];
    }

    const latestKey = activeVigencias.sort((a: string, b: string): number => {
      const aRows = this.rowsByVigencia.get(a);
      const bRows = this.rowsByVigencia.get(b);
      if (!aRows?.[0] || !bRows?.[0]) {
        return 0;
      }
      return bRows[0].validFrom.getTime() - aRows[0].validFrom.getTime();
    })[0];

    if (!latestKey) {
      return [];
    }

    return (this.rowsByVigencia.get(latestKey) ?? [])
      .filter((r): boolean => isActiveAt(r, date))
      .sort((a, b): number => a.sortOrder - b.sortOrder);
  }

  private resolveValidated(rows: TaxWithholdingBracket[]): ResolvedTaxWithholdingBracket[] {
    const resolved = rows.map(mapToResolvedTaxWithholdingBracket);
    validateTaxWithholdingBracketSet(resolved);
    return resolved;
  }
}

function vigenciaKey(tenantScope: string, validFrom: Date): string {
  return `${tenantScope}:${validFrom.toISOString()}`;
}

function isActiveAt(row: TaxWithholdingBracket, date: Date): boolean {
  return row.validFrom <= date && (row.validTo === null || row.validTo >= date);
}
