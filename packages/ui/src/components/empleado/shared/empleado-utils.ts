import type { EmpleadoAvatarTone } from './empleado-types';
import type { EmpleadoSortColumnKey, EmpleadoSortDirection } from './empleado-columns';

const AVATAR_TONES: EmpleadoAvatarTone[] = ['teal', 'cyan', 'amber', 'blue', 'coral', 'purple'];

export function resolveEmpleadoInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'EM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function resolveEmpleadoAvatarTone(seed: string): EmpleadoAvatarTone {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? 'teal';
}

export function formatEmpleadoCedula(value?: string): string {
  if (!value) return '-';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return value;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatEmpleadoContractLabel(contractType?: string): string {
  if (!contractType) return '-';
  if (contractType === 'PRESTACION') return 'SERVICIOS';
  return contractType.replace(/_/g, ' ');
}

export function formatEmpleadoHireDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toISOString().slice(0, 10);
}

export function toggleEmpleadoSort(
  currentColumn: EmpleadoSortColumnKey | null,
  currentDirection: EmpleadoSortDirection,
  nextColumn: EmpleadoSortColumnKey,
): { column: EmpleadoSortColumnKey; direction: EmpleadoSortDirection } {
  if (currentColumn === nextColumn) {
    return {
      column: nextColumn,
      direction: currentDirection === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    column: nextColumn,
    direction: 'asc',
  };
}
