// `type`, no `interface` — ver nota en employee-history.interfaces.ts.

/**
 * OS-588 (fase 4) — un solo año objetivo a la vez: el último año calendario cerrado
 * (`today.getUTCFullYear() - 1`), independientemente de si ya pasó su fecha límite. La
 * fecha límite de consignación de las cesantías del año objetivo cae en `plazoMes`/
 * `plazoDia` del año SIGUIENTE al objetivo (p.ej. cesantías 2025 → límite 14-feb-2026).
 * No usa el año actual directamente para evitar el salto de estado el mismo 14 de
 * febrero (ver tasks/OS-588.md §31 para el razonamiento completo).
 */
export const CESANTIAS_ALERT_URGENT_THRESHOLD_DAYS = 15;

export type CesantiasDeadlineStatus =
  | 'PENDIENTE'
  | 'PROXIMA_A_VENCER'
  | 'VENCE_HOY'
  | 'VENCIDA'
  | 'COMPLETADA';

export type CesantiasDeadlineResult = {
  targetYear: number;
  deadlineDate: Date;
  daysUntilDeadline: number;
  status: CesantiasDeadlineStatus;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Año calendario cerrado más reciente — ver nota de módulo. */
export function resolveCesantiasTargetYear(today: Date): number {
  return today.getUTCFullYear() - 1;
}

/**
 * `plazoDia`/`plazoMes` vienen de LaborLegalParameter (`CESANTIAS_PLAZO_DIA`/
 * `CESANTIAS_PLAZO_MES`, ver tasks/OS-588.md §31) — nunca hardcodeados aquí.
 */
export function resolveCesantiasDeadlineDate(
  targetYear: number,
  plazoDia: number,
  plazoMes: number,
): Date {
  return new Date(Date.UTC(targetYear + 1, plazoMes - 1, plazoDia));
}

export function daysUntilCesantiasDeadline(today: Date, deadlineDate: Date): number {
  const diffMs = startOfUtcDay(deadlineDate).getTime() - startOfUtcDay(today).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function resolveCesantiasDeadlineStatus(
  pendingCount: number,
  daysUntilDeadline: number,
): CesantiasDeadlineStatus {
  if (pendingCount === 0) {
    return 'COMPLETADA';
  }
  if (daysUntilDeadline < 0) {
    return 'VENCIDA';
  }
  if (daysUntilDeadline === 0) {
    return 'VENCE_HOY';
  }
  if (daysUntilDeadline <= CESANTIAS_ALERT_URGENT_THRESHOLD_DAYS) {
    return 'PROXIMA_A_VENCER';
  }
  return 'PENDIENTE';
}

export function resolveCesantiasDeadline(
  today: Date,
  plazoDia: number,
  plazoMes: number,
  pendingCount: number,
): CesantiasDeadlineResult {
  const targetYear = resolveCesantiasTargetYear(today);
  const deadlineDate = resolveCesantiasDeadlineDate(targetYear, plazoDia, plazoMes);
  const daysUntilDeadline = daysUntilCesantiasDeadline(today, deadlineDate);
  const status = resolveCesantiasDeadlineStatus(pendingCount, daysUntilDeadline);
  return { targetYear, deadlineDate, daysUntilDeadline, status };
}
