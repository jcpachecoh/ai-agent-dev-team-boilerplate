import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  adminAssignRolePermissionsGql,
  adminCreatePermissionGql,
  adminCreateRoleGql,
  adminDeactivatePermissionGql,
  adminDeactivateRoleGql,
  adminDuplicateRoleGql,
  adminUpdatePermissionGql,
  adminUpdateRoleGql,
} from '../api/admin-roles.graphql';
import { rolesKeys } from '../api/roles.keys';
import type {
  CreateRoleFormValues,
  DuplicateRoleFormValues,
  PermissionFormValues,
  UpdateRoleFormValues,
} from '../types';

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

export function useAdminDuplicateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, input }: { sourceId: string; input: DuplicateRoleFormValues }) =>
      adminDuplicateRoleGql(sourceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useAdminCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PermissionFormValues & { code: string }) => adminCreatePermissionGql(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.permissions() });
    },
  });
}

export function useAdminUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PermissionFormValues }) =>
      adminUpdatePermissionGql(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.permissions() });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useAdminDeactivatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeactivatePermissionGql(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.permissions() });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}
