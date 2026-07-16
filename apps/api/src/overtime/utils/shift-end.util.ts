import { parseHhMmToMinutes } from '../../turnos/shift-resolution.utils';

function buildShiftBoundaryDateTime(workDate: Date, hourMinute: string): Date {
  const [hour, minute] = hourMinute.split(':').map(Number);
  return new Date(
    Date.UTC(
      workDate.getUTCFullYear(),
      workDate.getUTCMonth(),
      workDate.getUTCDate(),
      hour,
      minute,
      0,
      0,
    ),
  );
}

/** Combina workDate (UTC midnight) con horaInicio del turno; soporta cruce de medianoche. */
export function computeShiftStartDateTime(
  workDate: Date,
  horaInicio: string,
  _horaFin: string,
): Date {
  return buildShiftBoundaryDateTime(workDate, horaInicio);
}

/** Combina workDate (UTC midnight) con horaFin del turno; soporta cruce de medianoche. */
export function computeShiftEndDateTime(workDate: Date, horaInicio: string, horaFin: string): Date {
  const result = buildShiftBoundaryDateTime(workDate, horaFin);

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
