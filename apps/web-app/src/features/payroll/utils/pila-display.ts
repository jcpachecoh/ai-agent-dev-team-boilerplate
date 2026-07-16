import type {
  PilaDeadlineStatus,
  PilaExportFormat,
  PilaPeriodExport,
  PilaPeriodExportStatus,
  PilaUiStatus,
  PilaValidationError,
} from '../types/pila.types';

export const PILA_STATUS_LABELS: Record<PilaUiStatus, string> = {
  PENDING: 'Pendiente',
  VALIDATION_FAILED: 'Con errores',
  GENERATED: 'Generado',
  PAID: 'Pagado',
  VOIDED: 'Anulado',
};

export const PILA_FORMAT_LABELS: Record<PilaExportFormat, string> = {
  TXT: 'Archivo plano TXT — Anexo Técnico 2',
  XLSX: 'Plantilla XLSX — Aportes en Línea',
};

/** Límite de filas de la plantilla oficial Aportes en Línea v1. */
export const PILA_XLSX_MAX_EMPLOYEES = 20;

export const PILA_DEADLINE_STATUS_LABELS: Record<PilaDeadlineStatus, string> = {
  NOT_DUE: 'Sin vencimiento próximo',
  UPCOMING: 'PILA próxima a vencer',
  DUE_TODAY: 'PILA vence hoy',
  OVERDUE: 'PILA vencida',
  PAID: 'PILA pagada',
  CONFIG_INCOMPLETE: 'Configuración incompleta',
};

export function formatPilaMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPilaDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Fecha límite YYYY-MM-DD en UTC (evita -1 día en Bogotá). */
export function formatPilaDeadlineDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return '—';
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    dateStyle: 'medium',
  }).format(date);
}

export function getActivePilaExport(
  exports: PilaPeriodExport[],
  format?: PilaExportFormat,
): PilaPeriodExport | null {
  return (
    exports.find(
      (row) =>
        (row.status === 'GENERATED' || row.status === 'PAID') &&
        (format === undefined || row.format === format),
    ) ?? null
  );
}

export function derivePilaUiStatus(input: {
  active: PilaPeriodExport | null;
  validationOk: boolean | null;
}): PilaUiStatus {
  if (input.active) {
    return input.active.status;
  }
  if (input.validationOk === false) {
    return 'VALIDATION_FAILED';
  }
  return 'PENDING';
}

export function canGeneratePila(input: {
  canWrite: boolean;
  activeForFormat: PilaPeriodExport | null;
  validationOk: boolean | null;
  hasPaidHistory: boolean;
}): boolean {
  if (!input.canWrite) {
    return false;
  }
  if (input.hasPaidHistory) {
    return false;
  }
  if (input.activeForFormat?.status === 'PAID') {
    return false;
  }
  if (input.validationOk !== true) {
    return false;
  }
  return true;
}

export function canMarkPilaPaid(canWrite: boolean, row: PilaPeriodExport): boolean {
  return canWrite && row.status === 'GENERATED';
}

export function canVoidPila(canWrite: boolean, row: PilaPeriodExport): boolean {
  return canWrite && (row.status === 'GENERATED' || row.status === 'PAID');
}

export function groupPilaErrorsByEmployee(
  errors: PilaValidationError[],
): Array<{ key: string; employeeName: string; errors: PilaValidationError[] }> {
  const map = new Map<string, { employeeName: string; errors: PilaValidationError[] }>();
  for (const error of errors) {
    const key = error.employeeId ?? `field:${error.field}`;
    const employeeName = error.employeeName?.trim() || 'Datos del aportante / período';
    const bucket = map.get(key) ?? { employeeName, errors: [] };
    bucket.errors.push(error);
    map.set(key, bucket);
  }
  return [...map.entries()].map(([key, value]) => ({ key, ...value }));
}

export function hasPaidPilaHistory(exports: PilaPeriodExport[]): boolean {
  return exports.some((row) => row.paidAt !== null);
}

export function isBackendStatus(status: string): status is PilaPeriodExportStatus {
  return status === 'GENERATED' || status === 'PAID' || status === 'VOIDED';
}
