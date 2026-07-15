import type { Decimal } from '@prisma/client/runtime/library';

import { MONTHLY_ACCRUAL_DAYS } from '../interfaces/vacations.interfaces';

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function calendarDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function inclusiveCalendarDays(from: Date, to: Date): number {
  const startMs = startOfDay(from).getTime();
  const endMs = startOfDay(to).getTime();
  if (startMs > endMs) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((endMs - startMs) / dayMs) + 1;
}

/**
 * @param hireDate — fecha de ingreso (EmployeeDetails.hireDate)
 * @param accrualMonth — cualquier fecha dentro del mes calendario a acreditar
 * @returns días a acreditar (2 decimales, half-up); 0 si hireDate es posterior al mes
 */
export function calculateMonthlyAccrual(hireDate: Date, accrualMonth: Date): number {
  const year = accrualMonth.getFullYear();
  const monthIndex = accrualMonth.getMonth();
  const daysInMonth = calendarDaysInMonth(year, monthIndex);
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex, daysInMonth);

  const hireDay = startOfDay(hireDate);
  const workStart = hireDay > firstDayOfMonth ? hireDay : firstDayOfMonth;
  const workEnd = lastDayOfMonth;

  const daysWorked = inclusiveCalendarDays(workStart, workEnd);
  if (daysWorked <= 0) {
    return 0;
  }

  const raw = MONTHLY_ACCRUAL_DAYS * (daysWorked / daysInMonth);
  return Math.round(raw * 100) / 100;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Mes calendario anterior al de la fecha de referencia (primer día del mes). */
export function getAccrualThroughMonth(referenceDate: Date): Date {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
}

export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * OS-591 (fase 1) — proyección PURA (sin acceso a DB, sin efectos secundarios) de cuántos
 * días adicionales se acreditarían desde `existingLastAccrualDate` hasta `asOfDate`. Mismo
 * bucle mes-a-mes que `VacationAccrualService.syncEmployeeBalance`, extraído aquí para que
 * ambos (el flujo que persiste y el que solo previsualiza) usen exactamente la misma
 * fórmula — evita que "saldo a una fecha" y "saldo acumulado real" puedan divergir por una
 * segunda implementación del bucle.
 */
export function projectAccrualThrough(
  hireDate: Date,
  existingAccruedDays: Decimal,
  existingLastAccrualDate: Date,
  asOfDate: Date,
): { accruedDays: Decimal; monthsAccrued: number; lastAccrualDate: Date } {
  const accrualThroughMonth = getAccrualThroughMonth(asOfDate);
  let currentMonth =
    existingLastAccrualDate.getTime() === 0
      ? startOfMonth(hireDate)
      : addMonths(startOfMonth(existingLastAccrualDate), 1);

  let accruedDays = existingAccruedDays;
  let monthsAccrued = 0;
  let lastAccrualDate = existingLastAccrualDate;

  while (currentMonth.getTime() <= accrualThroughMonth.getTime()) {
    const delta = calculateMonthlyAccrual(hireDate, currentMonth);
    if (delta > 0) {
      accruedDays = accruedDays.plus(delta);
    }
    lastAccrualDate = startOfMonth(currentMonth);
    monthsAccrued += 1;
    currentMonth = addMonths(currentMonth, 1);
  }

  return { accruedDays, monthsAccrued, lastAccrualDate };
}
