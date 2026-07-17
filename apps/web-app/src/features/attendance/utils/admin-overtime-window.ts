/**
 * Construye instantes ISO con offset Bogotá (-05:00) a partir de fecha local + HH:mm.
 * Si la hora fin es ≤ hora inicio del mismo día, asume cruce de medianoche (+1 día).
 */

function addOneCalendarDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + 1);
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildBogotaDateTimeIso(workDate: string, timeHHmm: string): string {
  const normalized = timeHHmm.length === 5 ? `${timeHHmm}:00` : timeHHmm;
  return `${workDate}T${normalized}.000-05:00`;
}

export function buildAdminOvertimeWindowPayload(input: {
  workDate: string;
  startTime: string;
  endTime: string;
}): {
  proposedStartTime: string;
  proposedEndTime: string;
  estimatedMinutes: number;
  crossesMidnight: boolean;
} {
  const crossesMidnight = input.endTime <= input.startTime;
  const endDate = crossesMidnight ? addOneCalendarDay(input.workDate) : input.workDate;
  const proposedStartTime = buildBogotaDateTimeIso(input.workDate, input.startTime);
  const proposedEndTime = buildBogotaDateTimeIso(endDate, input.endTime);
  const estimatedMinutes = Math.round(
    (Date.parse(proposedEndTime) - Date.parse(proposedStartTime)) / 60_000,
  );

  return {
    proposedStartTime,
    proposedEndTime,
    estimatedMinutes,
    crossesMidnight,
  };
}

export function formatEstimatedDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '—';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} min`;
}
