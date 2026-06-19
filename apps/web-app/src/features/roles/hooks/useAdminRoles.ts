import { useQuery } from '@tanstack/react-query';

import {
  fetchAdminRoleGql,
  fetchAdminRolesGql,
  fetchPermissionCatalogGql,
} from '../api/admin-roles.graphql';
import { rolesKeys } from '../api/roles.keys';

export function useAdminRoles(includeInactive = false) {
  return useQuery({
    queryKey: rolesKeys.list(includeInactive),
    queryFn: () => fetchAdminRolesGql(includeInactive),
  });
}

export function useAdminRoleDetail(id: string | undefined) {
  return useQuery({
    queryKey: rolesKeys.detail(id ?? ''),
    queryFn: () => fetchAdminRoleGql(id!),
    enabled: Boolean(id),
  });
}

export function usePermissionCatalog(includeInactive = false) {
  return useQuery({
    queryKey: rolesKeys.permissions(includeInactive),
    queryFn: () => fetchPermissionCatalogGql(includeInactive),
    staleTime: 10 * 60 * 1000,
  });
}
