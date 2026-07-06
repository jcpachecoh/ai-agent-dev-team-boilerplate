export const REGULAR_DAY_MINUTES = 480;
export const NOCTURNO_START_HOUR = 21;
export const NOCTURNO_END_HOUR = 6;
export const KIOSK_MAX_ATTEMPTS = 3;
export const KIOSK_LOCK_DURATION_MS = 15 * 60 * 1000;
export const COLOMBIA_TZ = 'America/Bogota';

export const SHIFT_MORNING_START = 6;
export const SHIFT_MORNING_END = 14;
export const SHIFT_AFTERNOON_START = 14;
export const SHIFT_AFTERNOON_END = 22;
export const LATE_ARRIVAL_TOLERANCE_MINUTES = 5;

// Ley 2101/2021: jornada semanal máxima 46h a partir de 2025
export const MAX_WEEKLY_MINUTES = 46 * 60;

// OS-551 — Tarjeta de Asistencia
export const ATTENDANCE_CARD_MAX_RANGE_MONTHS = 3;
export const ATTENDANCE_CARD_HISTORY_LIMIT = 1000;

// OS-553 — motivos de cambio permitidos para marcaciones manuales
// (debe coincidir con ASISTENCIA_TARJETA_MARK_REASONS en packages/ui/src/components/asistencia/shared/asistencia-types.ts)
export const ATTENDANCE_MANUAL_MARKING_REASONS = [
  'FORGOT',
  'DEVICE_FAILURE',
  'SUPERVISOR_CORRECTION',
  'SYSTEM_ERROR',
  'OTHER',
] as const;

export type AttendanceManualMarkingReason = (typeof ATTENDANCE_MANUAL_MARKING_REASONS)[number];
