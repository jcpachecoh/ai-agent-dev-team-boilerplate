import type { SedeAssignedUser, SedeTableRowData } from '@restopsiq/ui';

import { formatUserDisplayName } from '@/features/auth/mappers/display';
import type { AdminUserApi } from '@/features/usuarios/types';

import type { LocationApiModel, LocationAssignedUserApi, SedeFormValues } from '../types';

const AVATAR_TONES: SedeAssignedUser['tone'][] = ['teal', 'coral', 'indigo', 'amber', 'purple'];

function formatLocationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 10);
}

function buildInitials(email: string, cedula: string): string {
  const local = email.split('@')[0] ?? '';
  if (local.length >= 2) {
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return cedula.slice(0, 2).toUpperCase();
}

function displayNameFromUser(user: LocationAssignedUserApi): string {
  const local = user.email.split('@')[0]?.replace(/[._-]/g, ' ').trim();
  if (local) {
    return local
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return user.cedula;
}

export function enrichAssignedUsers(
  assigned: SedeAssignedUser[],
  adminUsers: AdminUserApi[] | undefined,
): SedeAssignedUser[] {
  if (!adminUsers?.length) return assigned;

  const adminById = new Map(adminUsers.map((user) => [user.id, user]));

  return assigned.map((user, index) => {
    const admin = adminById.get(user.id);
    if (!admin) return user;

    return {
      ...mapLocationAssignedUser(
        {
          id: admin.id,
          email: admin.email,
          cedula: admin.cedula,
          isActive: admin.isActive,
          restaurantId: admin.tenantId,
        },
        index,
      ),
      name: formatUserDisplayName(admin.email),
      roleLabel: admin.role.name,
    };
  });
}

export function mapLocationToTableRow(
  location: LocationApiModel,
  assignedUsers: SedeAssignedUser[] = [],
): SedeTableRowData {
  return {
    id: location.id,
    name: location.name,
    createdAt: formatLocationDate(location.createdAt),
    address: location.address,
    city: location.city ?? undefined,
    phone: location.phone ?? undefined,
    isActive: location.isActive,
    assignedUsers,
  };
}

export function mapLocationUsersToAssigned(
  users: LocationAssignedUserApi[],
  adminUsers: AdminUserApi[] | undefined,
  toneOffset = 0,
): SedeAssignedUser[] {
  const mapped = users.map((user, index) => mapLocationAssignedUser(user, toneOffset + index));
  return enrichAssignedUsers(mapped, adminUsers);
}

export function parseLocationBusinessHours(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as import('../types').LocationBusinessHoursInput;
  } catch {
    return null;
  }
}

export function mapLocationToFormValues(location: LocationApiModel): SedeFormValues {
  return {
    name: location.name,
    address: location.address,
    city: location.city ?? '',
    phone: location.phone ?? '',
    isActive: location.isActive,
    openingTime: location.openingTime ?? null,
    closingTime: location.closingTime ?? null,
  };
}

export function mapLocationAssignedUser(
  user: LocationAssignedUserApi,
  index: number,
): SedeAssignedUser {
  return {
    id: user.id,
    name: displayNameFromUser(user),
    email: user.email,
    roleLabel: user.isActive ? 'Usuario activo' : 'Usuario inactivo',
    initials: buildInitials(user.email, user.cedula),
    tone: AVATAR_TONES[index % AVATAR_TONES.length],
  };
}
