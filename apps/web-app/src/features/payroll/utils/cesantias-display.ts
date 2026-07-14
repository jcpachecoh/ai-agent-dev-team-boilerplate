import { formatCurrencyCop, formatDateOnly } from './payroll-employee-display.utils';
import type {
  CesantiasDeadlineStatus,
  CesantiasFundChannel,
  CesantiasInterestStatus,
  CesantiasSettlementStatus,
} from '../types/cesantias.types';

export { formatCurrencyCop, formatDateOnly };

/**
 * `formatDateOnly` (payroll-employee-display.utils.ts) parsea el string con `new Date(value)`,
 * que interpreta una fecha "solo fecha" (`"2027-02-14"`) como medianoche UTC — en cualquier
 * timezone detrás de UTC (incluida America/Bogota, UTC-5) `.toLocaleDateString()` la muestra
 * un día antes (13 en vez de 14). No se corrige `formatDateOnly` en sí (es compartido por
 * pantallas fuera del alcance de esta fase) — para `deadlineDate` (siempre una fecha pura,
 * sin hora significativa) se parsea manualmente en UTC para evitar ese corrimiento.
 */
export function formatCesantiasDeadlineDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
  });
}

export const CESANTIAS_STATUS_LABELS: Record<CesantiasSettlementStatus, string> = {
  CALCULADA: 'Calculada',
  CONSIGNADA: 'Consignada',
  ANULADA: 'Anulada',
};

export const CESANTIAS_INTEREST_STATUS_LABELS: Record<CesantiasInterestStatus, string> = {
  CALCULADO: 'Calculado',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

export const CESANTIAS_FUND_CHANNEL_LABELS: Record<CesantiasFundChannel, string> = {
  FNA: 'FNA',
  PRIVATE_OPERATOR: 'Fondo privado',
};

export const CESANTIAS_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'CALCULADA', label: CESANTIAS_STATUS_LABELS.CALCULADA },
  { value: 'CONSIGNADA', label: CESANTIAS_STATUS_LABELS.CONSIGNADA },
  { value: 'ANULADA', label: CESANTIAS_STATUS_LABELS.ANULADA },
];

export const CESANTIAS_FUND_CHANNEL_FILTER_OPTIONS = [
  { value: '', label: 'Todos los canales' },
  { value: 'FNA', label: CESANTIAS_FUND_CHANNEL_LABELS.FNA },
  { value: 'PRIVATE_OPERATOR', label: CESANTIAS_FUND_CHANNEL_LABELS.PRIVATE_OPERATOR },
];

export const CESANTIAS_DEADLINE_STATUS_LABELS: Record<CesantiasDeadlineStatus, string> = {
  PENDIENTE: 'Liquidaciones pendientes',
  PROXIMA_A_VENCER: 'Consignación próxima a vencer',
  VENCE_HOY: 'Consignación vence hoy',
  VENCIDA: 'Consignación vencida',
  COMPLETADA: 'Consignación al día',
};

export function buildCesantiasYearOptions(
  currentYear: number,
  span = 6,
): { value: string; label: string }[] {
  const years: { value: string; label: string }[] = [];
  for (let year = currentYear; year > currentYear - span; year -= 1) {
    years.push({ value: String(year), label: String(year) });
  }
  return years;
}
