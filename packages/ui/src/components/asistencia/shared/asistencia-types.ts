import { MANUAL_MARKING_REASON_CATALOG } from '@restopsiq/shared';

export type AsistenciaTheme = 'light' | 'dark';

export type AsistenciaSize = 'sm' | 'md';

export type AsistenciaEmployeeStatus = 'on-shift' | 'absent' | 'off-schedule';

export type AsistenciaAvatarTone = 'sand' | 'teal' | 'blue' | 'purple' | 'coral' | 'gold';

export type AsistenciaCardHighlight = 'none' | 'overtime';

export type AsistenciaViewMode = 'grid' | 'list';

export interface AsistenciaLocationTab {
  id: string;
  name: string;
  city: string;
}

export interface AsistenciaLegendEntry {
  id: string;
  label: string;
  status: AsistenciaEmployeeStatus;
}

export interface AsistenciaMonitorMetrics {
  onShift: number;
  absent: number;
  offSchedule: number;
  overtime: number;
  legalAlerts: number;
  total: number;
}

export interface AsistenciaLocationMetrics {
  total: number;
  onShift: number;
  absent: number;
  lateArrivals: number;
  overtime: number;
}

export interface AsistenciaLocationSummary {
  id: string;
  name: string;
  city: string;
  metrics: AsistenciaLocationMetrics;
}

export type AsistenciaMonitorPeriod = 'day' | 'week' | 'month' | 'year';

export type AsistenciaEmployeeCategory = 'on-shift' | 'absent' | 'late' | 'overtime';

export interface AsistenciaCategoryEmployees {
  onShift: AsistenciaEmployeeCardData[];
  absent: AsistenciaEmployeeCardData[];
  late: AsistenciaEmployeeCardData[];
  overtime: AsistenciaEmployeeCardData[];
}

export interface AsistenciaEmployeeCardData {
  id: string;
  userId?: string;
  name: string;
  role: string;
  status?: AsistenciaEmployeeStatus;
  entryLabel?: string;
  shiftRange?: string;
  workedTime?: string;
  overtimeLabel?: string;
  progressPercent?: number;
  progressTone?: 'accent' | 'amber' | 'muted';
  highlight?: AsistenciaCardHighlight;
}

export type AsistenciaTarjetaRowVariant = 'default' | 'absence' | 'rest' | 'festive';

export interface AsistenciaTarjetaHeaderData {
  fullName: string;
  position: string;
  cedula: string;
  employer: string;
  contractType: string;
  hireDate: string;
}

export type AsistenciaTarjetaSummaryVariant =
  | 'ordinary'
  | 'unworked'
  | 'overtime'
  | 'permission'
  | 'absence';

export interface AsistenciaTarjetaMetricData {
  id: string;
  label: string;
  value: string;
  variant: AsistenciaTarjetaSummaryVariant;
}

export interface AsistenciaTarjetaDayRow {
  id: string;
  dayShort: string;
  dateLabel: string;
  shiftName: string;
  shiftRange: string;
  entryTime: string;
  exitTime: string;
  ordinaryHours: string;
  unworkedHours: string;
  overtimeHours: string;
  approvedOvertimeHours: string;
  targetHours: string;
  permissions: string;
  variant: AsistenciaTarjetaRowVariant;
  hasObservation?: boolean;
  hasManualMarking?: boolean;
  isAutomaticEntry?: boolean;
  isAutomaticExit?: boolean;
  /** Texto de estado (vacaciones, novedad, incapacidad) en lugar de hora. */
  entryTimeIsStatusLabel?: boolean;
  exitTimeIsStatusLabel?: boolean;
}

export type AsistenciaTarjetaSortKey =
  | 'dayShort'
  | 'dateLabel'
  | 'shiftName'
  | 'shiftRange'
  | 'entryTime'
  | 'exitTime'
  | 'ordinaryHours'
  | 'unworkedHours'
  | 'overtimeHours'
  | 'approvedOvertimeHours'
  | 'targetHours'
  | 'permissions';

export type AsistenciaTarjetaSortDirection = 'asc' | 'desc';

export type AsistenciaTarjetaExportAction = 'excel' | 'pdf' | 'email';

export type AsistenciaTarjetaRowAction = 'observation' | 'marking';

export type AsistenciaTarjetaMarkType = 'ENTRY' | 'EXIT';

export interface AsistenciaTarjetaMarkDraft {
  id: string;
  type: AsistenciaTarjetaMarkType;
  /** Value for datetime-local input (YYYY-MM-DDTHH:mm:ss) */
  datetimeLocal: string;
}

export interface AsistenciaTarjetaMarkReasonOption {
  value: string;
  label: string;
}

/** Catálogo unificado CONN-05 (placeholder + motivos de nómina/incapacidad/corrección). */
export const ASISTENCIA_TARJETA_MARK_REASONS: AsistenciaTarjetaMarkReasonOption[] = [
  { value: '', label: 'Seleccione motivo de cambio…' },
  ...MANUAL_MARKING_REASON_CATALOG.map((option) => ({
    value: option.code,
    label: option.label,
  })),
];
