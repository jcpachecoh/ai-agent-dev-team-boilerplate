/**
 * OS-595 — fecha límite de pago PILA (días hábiles nacionales).
 *
 * ## Período vs mes de pago
 * - `period` / `periodHealth`: período de cotización (`YYYY-MM`), liquidación OS-380.
 * - `paymentMonth`: mes calendario siguiente al de cotización (dic → ene del año siguiente).
 * - La fecha límite es el N-ésimo día hábil de `paymentMonth`.
 *
 * ## NIT
 * Usa `Tenant.nit` normalizado (solo dígitos). Los dos últimos dígitos **no** incluyen DV.
 *
 * ## Días hábiles
 * Lunes–viernes excluyendo festivos nacionales (`isColombianHoliday`).
 * No incluye festivos locales/empresariales.
 *
 * ## Umbral visual
 * `PILA_ALERT_THRESHOLD_DAYS = 5` (días calendario antes del vencimiento).
 * Constante centralizada — no es LaborLegalParameter (evita migración solo para UI).
 *
 * ## Scheduler
 * No hay job: la UI consulta bajo demanda `GET /api/reports/pila/:period/deadline`.
 */

import { isColombianHoliday } from '../../reports/service/colombia-holidays.util';
import { getBogotaTodayDateString } from '../../vacations/utils/vacation-business-days.utils';
import { normalizeNitDigits } from './pila-master-data.util';

/** Días calendario antes del vencimiento para mostrar alerta UPCOMING. */
export const PILA_ALERT_THRESHOLD_DAYS = 5;

export type PilaDeadlineStatus =
  | 'NOT_DUE'
  | 'UPCOMING'
  | 'DUE_TODAY'
  | 'OVERDUE'
  | 'PAID'
  | 'CONFIG_INCOMPLETE';

export type PilaDeadlineResult = {
  period: string;
  paymentMonth: string;
  dueDate: string | null;
  businessDayNumber: number | null;
  lastTwoNitDigits: string | null;
  daysRemaining: number | null;
  status: PilaDeadlineStatus;
  shouldAlert: boolean;
  timezone: 'America/Bogota';
  message?: string;
};

type NitDigitRange = { min: number; max: number; businessDay: number };

/** Tabla vigente: últimos 2 dígitos NIT (sin DV) → día hábil del mes de pago. */
export const PILA_NIT_BUSINESS_DAY_RANGES: readonly NitDigitRange[] = [
  { min: 0, max: 7, businessDay: 2 },
  { min: 8, max: 14, businessDay: 3 },
  { min: 15, max: 21, businessDay: 4 },
  { min: 22, max: 28, businessDay: 5 },
  { min: 29, max: 35, businessDay: 6 },
  { min: 36, max: 42, businessDay: 7 },
  { min: 43, max: 49, businessDay: 8 },
  { min: 50, max: 56, businessDay: 9 },
  { min: 57, max: 63, businessDay: 10 },
  { min: 64, max: 69, businessDay: 11 },
  { min: 70, max: 75, businessDay: 12 },
  { min: 76, max: 81, businessDay: 13 },
  { min: 82, max: 87, businessDay: 14 },
  { min: 88, max: 93, businessDay: 15 },
  { min: 94, max: 99, businessDay: 16 },
] as const;

export function isValidPilaPeriod(period: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

/** Mes de pago = mes siguiente al de cotización (maneja dic→ene). */
export function resolvePilaPaymentMonth(period: string): string {
  if (!isValidPilaPeriod(period)) {
    throw new Error(`Invalid PILA period: ${period}`);
  }
  const [yearStr, monthStr] = period.split('-');
  let year = Number(yearStr);
  let month = Number(monthStr) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function extractLastTwoNitDigits(nit: string): string | null {
  const digits = normalizeNitDigits(nit);
  if (digits.length < 2) {
    return null;
  }
  return digits.slice(-2);
}

export function getPilaDueBusinessDay(lastTwoNitDigits: string | number): number {
  const value =
    typeof lastTwoNitDigits === 'number' ? lastTwoNitDigits : Number.parseInt(lastTwoNitDigits, 10);
  if (!Number.isInteger(value) || value < 0 || value > 99) {
    throw new Error(`Invalid NIT last-two digits: ${String(lastTwoNitDigits)}`);
  }
  const range = PILA_NIT_BUSINESS_DAY_RANGES.find((r) => value >= r.min && value <= r.max);
  if (!range) {
    throw new Error(`No business-day mapping for digits ${value}`);
  }
  return range.businessDay;
}

function toDateOnlyUtc(year: number, month1Based: number, day: number): Date {
  return new Date(Date.UTC(year, month1Based - 1, day));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isPilaBusinessDay(date: Date): boolean {
  const dow = date.getUTCDay(); // 0 Sun … 6 Sat
  if (dow === 0 || dow === 6) {
    return false;
  }
  return !isColombianHoliday(date);
}

/**
 * N-ésimo día hábil del mes de pago (1-based). Solo cuenta días dentro de ese mes.
 */
export function resolveNthBusinessDayOfMonth(year: number, month1Based: number, nth: number): Date {
  if (!Number.isInteger(nth) || nth < 1) {
    throw new Error(`Invalid business day number: ${nth}`);
  }
  let counted = 0;
  const cursor = toDateOnlyUtc(year, month1Based, 1);
  while (cursor.getUTCFullYear() === year && cursor.getUTCMonth() === month1Based - 1) {
    if (isPilaBusinessDay(cursor)) {
      counted += 1;
      if (counted === nth) {
        return new Date(cursor.getTime());
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  throw new Error(`Could not resolve ${nth}th business day for ${year}-${month1Based}`);
}

export function calculatePilaDueDate(
  period: string,
  nit: string,
): {
  paymentMonth: string;
  dueDate: string;
  businessDayNumber: number;
  lastTwoNitDigits: string;
} {
  const lastTwo = extractLastTwoNitDigits(nit);
  if (!lastTwo) {
    throw new Error('NIT inválido o incompleto para calcular vencimiento PILA');
  }
  const businessDayNumber = getPilaDueBusinessDay(lastTwo);
  const paymentMonth = resolvePilaPaymentMonth(period);
  const [y, m] = paymentMonth.split('-').map(Number) as [number, number];
  const due = resolveNthBusinessDayOfMonth(y, m, businessDayNumber);
  return {
    paymentMonth,
    dueDate: formatDateOnly(due),
    businessDayNumber,
    lastTwoNitDigits: lastTwo.padStart(2, '0'),
  };
}

export function daysBetweenDateOnly(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00.000Z`);
  const to = new Date(`${toYmd}T00:00:00.000Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function resolvePilaDeadlineStatus(input: {
  isPaid: boolean;
  daysRemaining: number | null;
  configIncomplete: boolean;
}): PilaDeadlineStatus {
  if (input.configIncomplete) {
    return 'CONFIG_INCOMPLETE';
  }
  if (input.isPaid) {
    return 'PAID';
  }
  if (input.daysRemaining === null) {
    return 'CONFIG_INCOMPLETE';
  }
  if (input.daysRemaining < 0) {
    return 'OVERDUE';
  }
  if (input.daysRemaining === 0) {
    return 'DUE_TODAY';
  }
  if (input.daysRemaining <= PILA_ALERT_THRESHOLD_DAYS) {
    return 'UPCOMING';
  }
  return 'NOT_DUE';
}

export function shouldAlertPilaDeadline(status: PilaDeadlineStatus): boolean {
  return status === 'UPCOMING' || status === 'DUE_TODAY' || status === 'OVERDUE';
}

/**
 * Cálculo completo bajo demanda. `todayYmd` opcional (tests); default Bogotá.
 */
export function getPilaDeadlineStatus(input: {
  period: string;
  nit: string | null | undefined;
  isPaid: boolean;
  todayYmd?: string;
}): PilaDeadlineResult {
  const timezone = 'America/Bogota' as const;
  const todayYmd = input.todayYmd ?? getBogotaTodayDateString();

  if (!isValidPilaPeriod(input.period)) {
    return {
      period: input.period,
      paymentMonth: '',
      dueDate: null,
      businessDayNumber: null,
      lastTwoNitDigits: null,
      daysRemaining: null,
      status: 'CONFIG_INCOMPLETE',
      shouldAlert: false,
      timezone,
      message: 'Período inválido (se espera YYYY-MM)',
    };
  }

  if (!input.nit || !extractLastTwoNitDigits(input.nit)) {
    return {
      period: input.period,
      paymentMonth: resolvePilaPaymentMonth(input.period),
      dueDate: null,
      businessDayNumber: null,
      lastTwoNitDigits: null,
      daysRemaining: null,
      status: 'CONFIG_INCOMPLETE',
      shouldAlert: false,
      timezone,
      message: 'Configure el NIT del empleador (sin inventar fecha de vencimiento)',
    };
  }

  if (input.isPaid) {
    // PAID prevalece: aún calculamos la fecha para contexto, pero no alertamos deuda.
    try {
      const calc = calculatePilaDueDate(input.period, input.nit);
      const daysRemaining = daysBetweenDateOnly(todayYmd, calc.dueDate);
      return {
        period: input.period,
        paymentMonth: calc.paymentMonth,
        dueDate: calc.dueDate,
        businessDayNumber: calc.businessDayNumber,
        lastTwoNitDigits: calc.lastTwoNitDigits,
        daysRemaining,
        status: 'PAID',
        shouldAlert: false,
        timezone,
      };
    } catch {
      return {
        period: input.period,
        paymentMonth: resolvePilaPaymentMonth(input.period),
        dueDate: null,
        businessDayNumber: null,
        lastTwoNitDigits: extractLastTwoNitDigits(input.nit),
        daysRemaining: null,
        status: 'PAID',
        shouldAlert: false,
        timezone,
      };
    }
  }

  try {
    const calc = calculatePilaDueDate(input.period, input.nit);
    const daysRemaining = daysBetweenDateOnly(todayYmd, calc.dueDate);
    const status = resolvePilaDeadlineStatus({
      isPaid: false,
      daysRemaining,
      configIncomplete: false,
    });
    return {
      period: input.period,
      paymentMonth: calc.paymentMonth,
      dueDate: calc.dueDate,
      businessDayNumber: calc.businessDayNumber,
      lastTwoNitDigits: calc.lastTwoNitDigits,
      daysRemaining,
      status,
      shouldAlert: shouldAlertPilaDeadline(status),
      timezone,
    };
  } catch (err) {
    return {
      period: input.period,
      paymentMonth: resolvePilaPaymentMonth(input.period),
      dueDate: null,
      businessDayNumber: null,
      lastTwoNitDigits: extractLastTwoNitDigits(input.nit),
      daysRemaining: null,
      status: 'CONFIG_INCOMPLETE',
      shouldAlert: false,
      timezone,
      message: err instanceof Error ? err.message : 'No se pudo calcular el vencimiento PILA',
    };
  }
}
