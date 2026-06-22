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
