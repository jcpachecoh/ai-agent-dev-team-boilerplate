/** Minutos desde medianoche para "HH:mm". */
export function parseHhMmToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Duración del turno en minutos (soporta cruce de medianoche). */
export function computeShiftTargetMinutes(horaInicio: string, horaFin: string): number {
  const start = parseHhMmToMinutes(horaInicio);
  const end = parseHhMmToMinutes(horaFin);
  if (end >= start) {
    return end - start;
  }
  return 24 * 60 - start + end;
}

/** 0=domingo … 6=sábado (convención JS UTC). */
export function getUtcDayOfWeek(date: Date): number {
  return date.getUTCDay();
}
