import { graphqlRequest } from '@/lib/graphql-client';

import type { AdminRoleOptionApi, AdminUserApi } from '../types';

const ADMIN_USER_FIELDS = `
  id
  tenantId
  cedula
  documentType
  email
  role { id code name }
  isActive
  emailVerified
  lastLoginAt
  createdAt
`;

export const ADMIN_USERS_QUERY = `
  query AdminUsers($includeInactive: Boolean) {
    adminUsers(includeInactive: $includeInactive) {
      ${ADMIN_USER_FIELDS}
    }
  }
`;

export const ADMIN_ROLES_FOR_SELECT_QUERY = `
  query AdminRolesForSelect {
    adminRoles {
      id
      code
      name
      isActive
    }
  }
`;

export async function fetchAdminUsersGql(includeInactive = false): Promise<AdminUserApi[]> {
  const data = await graphqlRequest<{ adminUsers: AdminUserApi[] }>(ADMIN_USERS_QUERY, {
    includeInactive,
  });
  return data.adminUsers;
}

export async function fetchAdminRolesForSelectGql(): Promise<AdminRoleOptionApi[]> {
  const data = await graphqlRequest<{ adminRoles: AdminRoleOptionApi[] }>(
    ADMIN_ROLES_FOR_SELECT_QUERY,
  );
  return data.adminRoles;
}
