const REGULAR_DAY_MINUTES = 480;
const NOCTURNO_START_HOUR = 21;
const BOGOTA_TZ = 'America/Bogota';

export function formatMinutesAsHours(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

export function getBogotaHour(timestamp: string): number {
  const str = new Intl.DateTimeFormat('en', {
    timeZone: BOGOTA_TZ,
    hour: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  }).format(new Date(timestamp));
  const hour = parseInt(str, 10);
  return Number.isNaN(hour) ? 0 : hour;
}

export function formatTimeLabel(timestamp: string | undefined): string {
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: BOGOTA_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}

export function computeNightMinutes(
  entryTimestamp: string | undefined,
  exitTimestamp: string | undefined,
  workedMinutes: number,
): number {
  if (!entryTimestamp || !exitTimestamp || workedMinutes <= 0) return 0;
  const entryHour = getBogotaHour(entryTimestamp);
  const exitHour = getBogotaHour(exitTimestamp);
  if (entryHour >= NOCTURNO_START_HOUR || exitHour >= NOCTURNO_START_HOUR) {
    return Math.min(workedMinutes, Math.round(workedMinutes * 0.35));
  }
  return 0;
}

export function splitWorkedMinutes(workedMinutes: number): {
  ordinaryMinutes: number;
  overtimeMinutes: number;
} {
  const ordinaryMinutes = Math.min(workedMinutes, REGULAR_DAY_MINUTES);
  const overtimeMinutes = Math.max(0, workedMinutes - REGULAR_DAY_MINUTES);
  return { ordinaryMinutes, overtimeMinutes };
}

export function shiftLabel(shift?: string | null): { name: string; code: string } {
  switch (shift) {
    case 'MORNING':
      return { name: 'Mañana', code: 'M' };
    case 'AFTERNOON':
      return { name: 'Tarde', code: 'T' };
    case 'NIGHT':
      return { name: 'Noche', code: 'N' };
    default:
      return { name: '—', code: '—' };
  }
}
