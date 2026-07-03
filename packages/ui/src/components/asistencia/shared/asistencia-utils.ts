import type {
  AsistenciaAvatarTone,
  AsistenciaLocationSummary,
  AsistenciaMonitorMetrics,
} from './asistencia-types';

const avatarTones: AsistenciaAvatarTone[] = ['sand', 'teal', 'blue', 'purple', 'coral', 'gold'];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function getAvatarToneFromName(name: string): AsistenciaAvatarTone {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length] ?? 'teal';
}

export function formatWorkedDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatMetricFraction(value: number, total: number): string {
  return `${value} / ${total}`;
}

export function aggregateLocationMetrics(
  locations: AsistenciaLocationSummary[],
): AsistenciaMonitorMetrics {
  return locations.reduce<AsistenciaMonitorMetrics>(
    (acc, location) => ({
      total: acc.total + location.metrics.total,
      onShift: acc.onShift + location.metrics.onShift,
      absent: acc.absent + location.metrics.absent,
      offSchedule: acc.offSchedule + location.metrics.lateArrivals,
      overtime: acc.overtime + location.metrics.overtime,
      legalAlerts: acc.legalAlerts,
    }),
    { total: 0, onShift: 0, absent: 0, offSchedule: 0, overtime: 0, legalAlerts: 0 },
  );
}

export function sortLocationsByActivity(
  locations: AsistenciaLocationSummary[],
): AsistenciaLocationSummary[] {
  return [...locations].sort((left, right) => {
    const onShiftDiff = right.metrics.onShift - left.metrics.onShift;
    if (onShiftDiff !== 0) return onShiftDiff;

    const absentDiff = right.metrics.absent - left.metrics.absent;
    if (absentDiff !== 0) return absentDiff;

    const totalDiff = right.metrics.total - left.metrics.total;
    if (totalDiff !== 0) return totalDiff;

    return left.name.localeCompare(right.name, 'es');
  });
}
