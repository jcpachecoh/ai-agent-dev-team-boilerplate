import type { UsuarioRoleVariant } from './usuario-types';

export function formatUsuarioLastLogin(date: string | null | undefined): string {
  if (!date) {
    return '—';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatUsuarioDocumentType(type: string): string {
  const normalized = type.trim().toUpperCase();
  const labels: Record<string, string> = {
    CC: 'CC',
    CE: 'CE',
    PASAPORTE: 'PASAPORTE',
    NIT: 'NIT',
    TI: 'TI',
    PEP: 'PEP',
  };

  return labels[normalized] ?? type;
}

export function resolveUsuarioRoleVariant(roleCode?: string): UsuarioRoleVariant {
  const normalized = roleCode?.trim().toUpperCase();

  if (normalized === 'OWNER') {
    return 'owner';
  }

  if (normalized === 'SUPERVISOR') {
    return 'supervisor';
  }

  if (normalized === 'MANAGER') {
    return 'manager';
  }

  return 'default';
}
