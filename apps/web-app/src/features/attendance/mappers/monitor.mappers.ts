import type {
  AsistenciaCategoryEmployees,
  AsistenciaEmployeeCardData,
  AsistenciaLocationMetrics,
  AsistenciaLocationSummary,
  AsistenciaMonitorMetrics,
} from '@restopsiq/ui';

import type {
  AttendanceMonitorEmployee,
  AttendanceMonitorPeriod,
  AttendanceMonitorSummary,
} from '../types/attendance.types';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
}

function formatOvertimeLabel(minutes: number): string {
  return `+${formatDuration(minutes)} ext.`;
}

function mapEmployeeToCard(employee: AttendanceMonitorEmployee): AsistenciaEmployeeCardData {
  const workedMinutes = employee.workedMinutes ?? 0;
  const overtimeMinutes = employee.overtimeMinutes ?? 0;
  const status =
    employee.status === 'late'
      ? 'off-schedule'
      : employee.status === 'on-shift'
        ? 'on-shift'
        : employee.status === 'absent'
          ? 'absent'
          : 'on-shift';

  return {
    id: employee.employeeId,
    name: employee.name,
    role: employee.role,
    status,
    entryLabel: employee.entryLabel,
    workedTime: workedMinutes > 0 ? formatDuration(workedMinutes) : undefined,
    overtimeLabel: overtimeMinutes > 0 ? formatOvertimeLabel(overtimeMinutes) : undefined,
    progressPercent: workedMinutes > 0 ? Math.min(100, Math.round((workedMinutes / 480) * 100)) : 0,
    progressTone: overtimeMinutes > 0 ? 'amber' : 'accent',
    highlight: overtimeMinutes > 0 ? 'overtime' : 'none',
  };
}

export function mapMonitorSummaryToMetrics(
  summary: AttendanceMonitorSummary,
): AsistenciaMonitorMetrics {
  return {
    total: summary.metrics.total,
    onShift: summary.metrics.onShift,
    absent: summary.metrics.absent,
    offSchedule: summary.metrics.lateArrivals,
    overtime: summary.metrics.overtime,
    legalAlerts: summary.metrics.legalAlerts,
  };
}

export function mapMonitorSummaryToEmployees(
  summary: AttendanceMonitorSummary,
): AsistenciaCategoryEmployees {
  return {
    onShift: summary.employees.onShift.map(mapEmployeeToCard),
    absent: summary.employees.absent.map(mapEmployeeToCard),
    late: summary.employees.late.map(mapEmployeeToCard),
    overtime: summary.employees.overtime.map(mapEmployeeToCard),
  };
}

export function mapMonitorSummaryToLocationMetrics(
  summary: AttendanceMonitorSummary,
): AsistenciaLocationMetrics {
  return {
    total: summary.metrics.total,
    onShift: summary.metrics.onShift,
    absent: summary.metrics.absent,
    lateArrivals: summary.metrics.lateArrivals,
    overtime: summary.metrics.overtime,
  };
}

export function buildLocationSummary(
  location: { id: string; name: string; city?: string },
  summary: AttendanceMonitorSummary,
): AsistenciaLocationSummary {
  return {
    id: location.id,
    name: location.name,
    city: location.city ?? '',
    metrics: mapMonitorSummaryToLocationMetrics(summary),
  };
}

const PERIOD_LABELS: Record<AttendanceMonitorPeriod, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
};

export function formatMonitorPeriodLabel(summary: AttendanceMonitorSummary): string {
  const periodLabel = PERIOD_LABELS[summary.period];
  if (summary.dateFrom === summary.dateTo) {
    return `${summary.dateFrom} · ${periodLabel}`;
  }
  return `${summary.dateFrom} – ${summary.dateTo} · ${periodLabel}`;
}

export function formatLastSyncLabel(date: Date | undefined): string {
  if (!date) return 'hace 1s';
  const diffSec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  return `hace ${diffSec}s`;
}
