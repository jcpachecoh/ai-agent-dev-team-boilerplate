import { parseHhMmToMinutes } from '../../turnos/shift-resolution.utils';

/** Combina workDate (UTC midnight) con horaFin del turno; soporta cruce de medianoche. */
export function computeShiftEndDateTime(workDate: Date, horaInicio: string, horaFin: string): Date {
  const [endHour, endMinute] = horaFin.split(':').map(Number);
  const result = new Date(
    Date.UTC(
      workDate.getUTCFullYear(),
      workDate.getUTCMonth(),
      workDate.getUTCDate(),
      endHour,
      endMinute,
      0,
      0,
    ),
  );

  const startMinutes = parseHhMmToMinutes(horaInicio);
  const endMinutes = parseHhMmToMinutes(horaFin);
  if (endMinutes < startMinutes) {
    result.setUTCDate(result.getUTCDate() + 1);
  }

  return result;
}

export function computeExcessMinutes(actualEndTime: Date, shiftEndTime: Date): number {
  const diffMs = actualEndTime.getTime() - shiftEndTime.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60_000);
}
