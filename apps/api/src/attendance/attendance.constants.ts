export const REGULAR_DAY_MINUTES = 480;
// NOCTURNO_START_HOUR removed (OS-585) — resolve via
// LaborLegalParametersService.getValueAt('HORARIO_NOCTURNO_INICIO', date, tenantId) instead;
// the legal value changed from 21 to 19 on 2025-12-25 (Ley 2466 de 2025), which a static
// constant cannot represent.
// NOCTURNO_END_HOUR removed (OS-586) — was dead code (unreferenced); nocturno classification
// only checks entry/exit against the start hour, never an end hour.
export const KIOSK_MAX_ATTEMPTS = 3;
export const KIOSK_LOCK_DURATION_MS = 15 * 60 * 1000;
export const COLOMBIA_TZ = 'America/Bogota';

export const SHIFT_MORNING_START = 6;
export const SHIFT_MORNING_END = 14;
export const SHIFT_AFTERNOON_START = 14;
export const SHIFT_AFTERNOON_END = 22;
export const LATE_ARRIVAL_TOLERANCE_MINUTES = 5;

// MAX_WEEKLY_MINUTES removed (OS-585) — was dead code (unreferenced) and legally imprecise
// (calendar-year based). Resolve via
// LaborLegalParametersService.getValueAt('JORNADA_MAX_SEMANAL', date, tenantId) instead
// (Ley 2101/2021 steps down on July 15 of each year, not Jan 1).

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

// ASIS-UNI — ventana para detectar marcaciones duplicadas (mismo empleado, tipo, source y timestamp)
export const ATTENDANCE_DUPLICATE_WINDOW_MS = 60_000;

// SHIFT-UNI — tolerancia al validar marcación manual contra ventana del turno asignado
export const SHIFT_WINDOW_TOLERANCE_MINUTES = 30;
