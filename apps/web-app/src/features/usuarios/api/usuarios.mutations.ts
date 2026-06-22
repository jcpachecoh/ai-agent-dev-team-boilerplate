import { graphqlRequest } from '@/lib/graphql-client';

import type { AdminUserApi, DocumentType } from '../types';

const ADMIN_USER_FIELDS = `
  id
  tenantId
  name
  cedula
  documentType
  email
  role { id code name }
  isActive
  emailVerified
  lastLoginAt
  createdAt
`;

export const ADMIN_CREATE_USER_MUTATION = `
  mutation AdminCreateUser($input: CreateAdminUserInput!) {
    adminCreateUser(input: $input) {
      ${ADMIN_USER_FIELDS}
    }
  }
`;

export const ADMIN_UPDATE_USER_MUTATION = `
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      ${ADMIN_USER_FIELDS}
    }
  }
`;

export const ADMIN_DEACTIVATE_USER_MUTATION = `
  mutation AdminDeactivateUser($id: ID!) {
    adminDeactivateUser(id: $id)
  }
`;

export interface AdminCreateUserInput {
  name: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId: string;
  locationId?: string;
}

export interface AdminUpdateUserInput {
  email?: string;
  roleId?: string;
}

export async function adminCreateUserGql(input: AdminCreateUserInput): Promise<AdminUserApi> {
  const data = await graphqlRequest<{ adminCreateUser: AdminUserApi }>(ADMIN_CREATE_USER_MUTATION, {
    input,
  });
  return data.adminCreateUser;
}

export async function adminUpdateUserGql(
  id: string,
  input: AdminUpdateUserInput,
): Promise<AdminUserApi> {
  const data = await graphqlRequest<{ adminUpdateUser: AdminUserApi }>(ADMIN_UPDATE_USER_MUTATION, {
    id,
    input,
  });
  return data.adminUpdateUser;
}

export async function adminDeactivateUserGql(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ adminDeactivateUser: boolean }>(
    ADMIN_DEACTIVATE_USER_MUTATION,
    { id },
  );
  return data.adminDeactivateUser;
}
