import { graphqlRequest } from '@/lib/graphql-client';

import type {
  AdminRole,
  AdminRoleDetail,
  CreateRoleFormValues,
  PermissionCatalogItem,
  UpdateRoleFormValues,
} from '../types';

const ADMIN_ROLE_FIELDS = `
  id tenantId code name description isActive userCount permissionCount createdAt
`;

const ADMIN_ROLE_DETAIL_FIELDS = `
  ${ADMIN_ROLE_FIELDS}
  permissions { id code name module resource action }
`;

export const ADMIN_ROLES_QUERY = `
  query AdminRoles($includeInactive: Boolean) {
    adminRoles(includeInactive: $includeInactive) {
      ${ADMIN_ROLE_FIELDS}
    }
  }
`;

export const ADMIN_ROLE_QUERY = `
  query AdminRole($id: ID!) {
    adminRole(id: $id) {
      ${ADMIN_ROLE_DETAIL_FIELDS}
    }
  }
`;

export const ADMIN_PERMISSIONS_CATALOG_QUERY = `
  query AdminPermissions {
    adminPermissions {
      id code name description module resource action
    }
  }
`;

export const ADMIN_CREATE_ROLE_MUTATION = `
  mutation AdminCreateRole($input: CreateRoleInput!) {
    adminCreateRole(input: $input) {
      ${ADMIN_ROLE_FIELDS}
    }
  }
`;

export const ADMIN_UPDATE_ROLE_MUTATION = `
  mutation AdminUpdateRole($id: ID!, $input: UpdateRoleInput!) {
    adminUpdateRole(id: $id, input: $input) {
      ${ADMIN_ROLE_FIELDS}
    }
  }
`;

export const ADMIN_DEACTIVATE_ROLE_MUTATION = `
  mutation AdminDeactivateRole($id: ID!) {
    adminDeactivateRole(id: $id)
  }
`;

export const ADMIN_ASSIGN_ROLE_PERMISSIONS_MUTATION = `
  mutation AdminAssignRolePermissions($roleId: ID!, $permissionIds: [ID!]!) {
    adminAssignRolePermissions(roleId: $roleId, permissionIds: $permissionIds)
  }
`;

export async function fetchAdminRolesGql(includeInactive = false): Promise<AdminRole[]> {
  const data = await graphqlRequest<{ adminRoles: AdminRole[] }>(ADMIN_ROLES_QUERY, {
    includeInactive,
  });
  return data.adminRoles;
}

export async function fetchAdminRoleGql(id: string): Promise<AdminRoleDetail | null> {
  const data = await graphqlRequest<{ adminRole: AdminRoleDetail | null }>(ADMIN_ROLE_QUERY, {
    id,
  });
  return data.adminRole;
}

export async function fetchPermissionCatalogGql(): Promise<PermissionCatalogItem[]> {
  const data = await graphqlRequest<{ adminPermissions: PermissionCatalogItem[] }>(
    ADMIN_PERMISSIONS_CATALOG_QUERY,
  );
  return data.adminPermissions;
}

export async function adminCreateRoleGql(input: CreateRoleFormValues): Promise<AdminRole> {
  const data = await graphqlRequest<{ adminCreateRole: AdminRole }>(ADMIN_CREATE_ROLE_MUTATION, {
    input,
  });
  return data.adminCreateRole;
}

export async function adminUpdateRoleGql(
  id: string,
  input: UpdateRoleFormValues,
): Promise<AdminRole> {
  const data = await graphqlRequest<{ adminUpdateRole: AdminRole }>(ADMIN_UPDATE_ROLE_MUTATION, {
    id,
    input,
  });
  return data.adminUpdateRole;
}

export async function adminDeactivateRoleGql(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ adminDeactivateRole: boolean }>(
    ADMIN_DEACTIVATE_ROLE_MUTATION,
    { id },
  );
  return data.adminDeactivateRole;
}

export async function adminAssignRolePermissionsGql(
  roleId: string,
  permissionIds: string[],
): Promise<boolean> {
  const data = await graphqlRequest<{ adminAssignRolePermissions: boolean }>(
    ADMIN_ASSIGN_ROLE_PERMISSIONS_MUTATION,
    { roleId, permissionIds },
  );
  return data.adminAssignRolePermissions;
}
