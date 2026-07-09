import { NotFoundException } from '@nestjs/common';
import type { LaborLegalParameter } from '@prisma/client';

/**
 * In-memory resolver over a preloaded set of LaborLegalParameter rows.
 *
 * Built once per batch operation (e.g. one payroll period, one attendance report)
 * via LaborLegalParametersService.preload(), then queried synchronously per employee/day
 * instead of hitting the DB again — avoids N+1 queries when the same key/date range
 * is resolved for many employees or many days in a period.
 */
export class LegalParameterSnapshot {
  private readonly rowsByKey = new Map<string, LaborLegalParameter[]>();

  constructor(
    rows: LaborLegalParameter[],
    private readonly tenantId: string | null,
  ) {
    for (const row of rows) {
      const list = this.rowsByKey.get(row.key) ?? [];
      list.push(row);
      this.rowsByKey.set(row.key, list);
    }
  }

  /** Resolves the active value for `key` at `date` — tenant override first, then global. */
  numberAt(key: string, date: Date): number {
    const rows = this.rowsByKey.get(key) ?? [];
    const isActive = (row: LaborLegalParameter): boolean =>
      row.validFrom <= date && (row.validTo === null || row.validTo >= date);

    if (this.tenantId) {
      const tenantRow = this.latest(
        rows.filter((r) => r.tenantId === this.tenantId && isActive(r)),
      );
      if (tenantRow) {
        return Number(tenantRow.value);
      }
    }

    const globalRow = this.latest(rows.filter((r) => r.tenantId === null && isActive(r)));
    if (globalRow) {
      return Number(globalRow.value);
    }

    throw new NotFoundException(
      `No existe un valor vigente para el parámetro legal "${key}" en la fecha ${date.toISOString().slice(0, 10)}`,
    );
  }

  private latest(rows: LaborLegalParameter[]): LaborLegalParameter | undefined {
    return rows.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];
  }
}
