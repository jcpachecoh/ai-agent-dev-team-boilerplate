import type { EmpresaInformacionValues } from '@restopsiq/ui';

export interface RestaurantScheduleState {
  openTime?: string;
  closeTime?: string;
  operatingDays?: EmpresaInformacionValues['operatingDays'];
}

export function formatProfileUpdatedAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatAccessBadge(roleCode: string | undefined): string {
  const normalized = roleCode?.trim().toUpperCase() ?? '';

  if (normalized === 'OWNER') {
    return 'Owner · Acceso completo';
  }

  if (normalized === 'SUPERVISOR' || normalized === 'ADMIN' || normalized === 'MANAGER') {
    return `${normalized.charAt(0)}${normalized.slice(1).toLowerCase()} · Acceso administrativo`;
  }

  return 'Operador · Acceso limitado';
}
