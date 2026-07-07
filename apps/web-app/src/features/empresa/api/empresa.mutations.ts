import { graphqlRequest } from '@/lib/graphql-client';

import { TENANT_FIELDS, type TenantApiModel } from './empresa.queries';

export interface UpdateTenantInput {
  tradeName?: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingTime?: string | null;
  closingTime?: string | null;
}

export const UPDATE_TENANT_MUTATION = `
  mutation UpdateTenant($input: UpdateTenantInput!) {
    updateTenant(input: $input) {
      ${TENANT_FIELDS}
    }
  }
`;

export async function updateTenant(input: UpdateTenantInput): Promise<TenantApiModel> {
  const data = await graphqlRequest<{ updateTenant: TenantApiModel }>(UPDATE_TENANT_MUTATION, {
    input,
  });

  return data.updateTenant;
}
