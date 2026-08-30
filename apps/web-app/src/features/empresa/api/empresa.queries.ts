import { graphqlRequest } from '@/lib/graphql-client';

export interface TenantApiModel {
  id: string;
  name: string;
  nit?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  legalRepresentativeName?: string | null;
  legalRepresentativeDocumentType?: string | null;
  legalRepresentativeDocumentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  department?: string | null;
  country: string;
  taxRegime?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TENANT_FIELDS = `
  id
  name
  nit
  legalName
  tradeName
  legalRepresentativeName
  legalRepresentativeDocumentType
  legalRepresentativeDocumentNumber
  email
  phone
  address
  city
  department
  country
  taxRegime
  logoUrl
  isActive
  createdAt
  updatedAt
`;

export const MY_TENANT_QUERY = `
  query MyTenant {
    myTenant {
      ${TENANT_FIELDS}
    }
  }
`;

export async function fetchMyTenant(): Promise<TenantApiModel> {
  const data = await graphqlRequest<{ myTenant: TenantApiModel }>(MY_TENANT_QUERY);
  return data.myTenant;
}
