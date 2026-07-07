import type { AttendanceControlPanelTimelineRow } from '../types/attendance.types';

export function formatAttendanceSourceLabel(
  source: AttendanceControlPanelTimelineRow['source'],
): string {
  switch (source) {
    case 'APP_MOVIL':
      return 'App móvil';
    case 'MANUAL':
      return 'Manual';
    default:
      return 'Automática';
  }
}

export function formatRecordDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function resolveTimelineFullName(row: AttendanceControlPanelTimelineRow): string {
  return [row.nombres, row.primerApellido].filter(Boolean).join(' ');
}
