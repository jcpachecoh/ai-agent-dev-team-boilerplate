import type { AuthUserProfile, AuthUserViewModel } from '../types';

const ROLE_LABELS: Record<string, string> = {
  OPERATOR: 'Operador',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  OWNER: 'Propietario',
};

export function formatRoleCode(roleCode: string): string {
  const normalized = roleCode.trim().toUpperCase();
  return ROLE_LABELS[normalized] ?? roleCode.replace(/_/g, ' ');
}

/** Derives a readable label from email when the API has no display name. */
export function formatUserDisplayName(email: string): string {
  const local = email.split('@')[0]?.trim() ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function mapAuthUserToViewModel(profile: AuthUserProfile): AuthUserViewModel {
  return {
    id: profile.id,
    email: profile.email,
    displayName: formatUserDisplayName(profile.email),
    displayRole: formatRoleCode(profile.roleCode),
  };
}
