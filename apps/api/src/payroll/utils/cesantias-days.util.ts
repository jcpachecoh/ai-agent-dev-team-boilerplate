import type { SalaryType } from '@prisma/client';

import type {
  EmployeeFundHistoryRecord,
  EmployeeSalaryHistoryRecord,
} from '../interfaces/employee-history.interfaces';

/**
 * OS-588 (fase 2) — días causados en convención comercial (30 días por mes, año de 360),
 * el estándar legal colombiano para cesantías (CST art. 249 / Ley 50 de 1990), NO días
 * calendario reales. El divisor 360 en sí vive en LaborLegalParameter (DIVISOR_CESANTIAS)
 * y se aplica en la fórmula (CesantiasCalculationService), no aquí — esta función solo
 * cuenta días en esa convención, sin dividir.
 *
 * `end` es EXCLUSIVO (mismo criterio que EmployeeSalaryHistory.effectiveTo): el rango
 * contado es [start, end). Ejemplo: commercialDaysBetween(2026-01-01, 2027-01-01) = 360
 * (un año completo). commercialDaysBetween(2026-01-01, 2026-07-01) = 180 (medio año).
 *
 * El día de calendario se topa a 30 antes de restar (regla 30/360): el día 31 de un mes
 * cuenta como 30 para este propósito, y los meses de 28/29 días (febrero) NO se ajustan
 * hacia arriba — un rango que empieza el 2026-02-01 y termina el 2026-03-01 (exclusivo)
 * cuenta como 30 días comerciales aunque febrero solo tenga 28 días reales en 2026. Esta
 * es la convención estándar 30/360, no una aproximación propia.
 */
export function commercialDaysBetween(start: Date, end: Date): number {
  if (end <= start) {
    return 0;
  }
  const startDay = Math.min(start.getUTCDate(), 30);
  const endDay = Math.min(end.getUTCDate(), 30);

  const yearDiff = end.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = end.getUTCMonth() - start.getUTCMonth();
  const dayDiff = endDay - startDay;

  return yearDiff * 360 + monthDiff * 30 + dayDiff;
}

export function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

export function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type SalarySegment = {
  start: Date;
  /** Exclusivo — igual criterio que EmployeeSalaryHistory.effectiveTo. */
  endExclusive: Date;
  salaryType: SalaryType;
  salaryAmount: string;
  commercialDays: number;
};

/**
 * Recorta el historial salarial de un empleado a la ventana [windowStart, windowEndExclusive)
 * y devuelve un tramo por cada vigencia que intersecte, ordenado cronológicamente. Una
 * vigencia sin `effectiveTo` (la abierta/actual) se extiende hasta windowEndExclusive.
 *
 * No hay doble conteo: EmployeeSalaryHistory garantiza (por construcción, ver
 * EmployeeHistoryRepository.syncSalaryHistoryTx) que las vigencias de un mismo empleado no
 * se solapan — este recorte solo intersecta cada una con la ventana, nunca las combina.
 */
export function resolveSalarySegments(
  history: EmployeeSalaryHistoryRecord[],
  windowStart: Date,
  windowEndExclusive: Date,
): SalarySegment[] {
  const segments: SalarySegment[] = [];

  for (const entry of history) {
    const entryEnd = entry.effectiveTo ?? windowEndExclusive;
    const segStart = maxDate(entry.effectiveFrom, windowStart);
    const segEnd = minDate(entryEnd, windowEndExclusive);

    if (segStart >= segEnd) {
      continue;
    }

    segments.push({
      start: segStart,
      endExclusive: segEnd,
      salaryType: entry.salaryType,
      salaryAmount: entry.salaryAmount,
      commercialDays: commercialDaysBetween(segStart, segEnd),
    });
  }

  return segments.sort((a, b): number => a.start.getTime() - b.start.getTime());
}

/**
 * Fondo vigente en `asOfDate` (inclusivo) para el `fundType` dado. Usado con el cierre del
 * periodo (31-dic o fecha de retiro) para la regla "fondo vigente al cierre" — ver
 * CesantiasCalculationService. Si el empleado nunca tuvo una vigencia de ese fundType que
 * cubra asOfDate, devuelve undefined (caller decide cómo tratar "empleado sin fondo").
 */
export function resolveFundAtDate(
  fundHistory: EmployeeFundHistoryRecord[],
  fundType: EmployeeFundHistoryRecord['fundType'],
  asOfDate: Date,
): EmployeeFundHistoryRecord | undefined {
  return fundHistory.find(
    (f): boolean =>
      f.fundType === fundType &&
      f.effectiveFrom <= asOfDate &&
      (f.effectiveTo === null || f.effectiveTo > asOfDate),
  );
}
