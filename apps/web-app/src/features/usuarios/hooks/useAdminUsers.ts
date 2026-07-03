import { useQuery } from '@tanstack/react-query';

import { fetchAdminRolesForSelect, fetchAdminUsers } from '../api/usuarios.api';
import { usuariosKeys } from '../api/usuarios.keys';

export function useAdminUsers(includeInactive = false) {
  return useQuery({
    queryKey: usuariosKeys.list(includeInactive),
    queryFn: () => fetchAdminUsers(includeInactive),
  });
}

export function useAdminRolesForSelect() {
  return useQuery({
    queryKey: usuariosKeys.roles(),
    queryFn: fetchAdminRolesForSelect,
  });
}
