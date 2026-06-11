import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  adminAssignRolePermissionsGql,
  adminCreateRoleGql,
  adminDeactivateRoleGql,
  adminUpdateRoleGql,
} from '../api/admin-roles.graphql';
import { rolesKeys } from '../api/roles.keys';
import type { CreateRoleFormValues, UpdateRoleFormValues } from '../types';

export function useAdminCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleFormValues) => adminCreateRoleGql(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useAdminUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleFormValues }) =>
      adminUpdateRoleGql(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.detail(variables.id) });
    },
  });
}

export function useAdminDeactivateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeactivateRoleGql(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useAdminAssignRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      adminAssignRolePermissionsGql(roleId, permissionIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.detail(variables.roleId) });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}
