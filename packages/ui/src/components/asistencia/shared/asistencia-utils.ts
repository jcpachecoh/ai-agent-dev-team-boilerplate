import type { AsistenciaAvatarTone } from './asistencia-types';

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
