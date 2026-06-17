export type AsistenciaTheme = 'light' | 'dark';

export type AsistenciaSize = 'sm' | 'md';

export type AsistenciaEmployeeStatus = 'on-shift' | 'absent' | 'off-schedule';

export type AsistenciaAvatarTone = 'sand' | 'teal' | 'blue' | 'purple' | 'coral' | 'gold';

export type AsistenciaCardHighlight = 'none' | 'overtime';

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
