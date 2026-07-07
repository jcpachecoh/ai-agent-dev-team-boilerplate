import type { SedeAssignUserOption } from '@restopsiq/ui';
import { useMemo } from 'react';

import { formatUserDisplayName } from '@/features/auth/mappers/display';
import { useAdminUsers } from '@/features/usuarios/hooks/useAdminUsers';
import type { AdminUserApi } from '@/features/usuarios/types';

export function mapAdminUserToAssignOption(user: AdminUserApi): SedeAssignUserOption {
  return {
    id: user.id,
    label: formatUserDisplayName(user.email),
    hint: user.role.name,
  };
}

export function useAssignableUsers(assignedUserIds: string[]) {
  const adminUsersQuery = useAdminUsers(false);
  const assignedSet = useMemo(() => new Set(assignedUserIds), [assignedUserIds]);

  const assignableUsers = useMemo(() => {
    const users = adminUsersQuery.data ?? [];
    return users
      .filter((user) => user.isActive && !assignedSet.has(user.id))
      .map(mapAdminUserToAssignOption)
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [adminUsersQuery.data, assignedSet]);

  return {
    ...adminUsersQuery,
    assignableUsers,
  };
}
