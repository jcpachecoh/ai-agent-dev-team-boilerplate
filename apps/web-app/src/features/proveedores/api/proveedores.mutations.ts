import { graphqlRequest } from '@/lib/graphql-client';

import { SUPPLIER_FIELDS, SUPPLIER_PRODUCT_FIELDS } from './proveedores.fragments';
import type {
  CreateSupplierInput,
  CreateSupplierProductInput,
  SupplierApiModel,
  SupplierProductApiModel,
  UpdateSupplierInput,
  UpdateSupplierProductInput,
} from '../types';

export const CREATE_SUPPLIER_MUTATION = `
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      ${SUPPLIER_FIELDS}
    }
  }
`;

export const UPDATE_SUPPLIER_MUTATION = `
  mutation UpdateSupplier($id: ID!, $input: UpdateSupplierInput!) {
    updateSupplier(id: $id, input: $input) {
      ${SUPPLIER_FIELDS}
    }
  }
`;

export const DELETE_SUPPLIER_MUTATION = `
  mutation DeleteSupplier($id: ID!) {
    deleteSupplier(id: $id)
  }
`;

export const CREATE_SUPPLIER_PRODUCT_MUTATION = `
  mutation CreateSupplierProduct($input: CreateSupplierProductInput!) {
    createSupplierProduct(input: $input) {
      ${SUPPLIER_PRODUCT_FIELDS}
    }
  }
`;

export const UPDATE_SUPPLIER_PRODUCT_MUTATION = `
  mutation UpdateSupplierProduct($id: ID!, $input: UpdateSupplierProductInput!) {
    updateSupplierProduct(id: $id, input: $input) {
      ${SUPPLIER_PRODUCT_FIELDS}
    }
  }
`;

export const DELETE_SUPPLIER_PRODUCT_MUTATION = `
  mutation DeleteSupplierProduct($id: ID!) {
    deleteSupplierProduct(id: $id)
  }
`;

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierApiModel> {
  const data = await graphqlRequest<{ createSupplier: SupplierApiModel }>(
    CREATE_SUPPLIER_MUTATION,
    { input },
  );
  return data.createSupplier;
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput,
): Promise<SupplierApiModel> {
  const data = await graphqlRequest<{ updateSupplier: SupplierApiModel }>(
    UPDATE_SUPPLIER_MUTATION,
    { id, input },
  );
  return data.updateSupplier;
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteSupplier: boolean }>(DELETE_SUPPLIER_MUTATION, {
    id,
  });
  return data.deleteSupplier;
}

export async function createSupplierProduct(
  input: CreateSupplierProductInput,
): Promise<SupplierProductApiModel> {
  const data = await graphqlRequest<{ createSupplierProduct: SupplierProductApiModel }>(
    CREATE_SUPPLIER_PRODUCT_MUTATION,
    { input },
  );
  return data.createSupplierProduct;
}

export async function updateSupplierProduct(
  id: string,
  input: UpdateSupplierProductInput,
): Promise<SupplierProductApiModel> {
  const data = await graphqlRequest<{ updateSupplierProduct: SupplierProductApiModel }>(
    UPDATE_SUPPLIER_PRODUCT_MUTATION,
    { id, input },
  );
  return data.updateSupplierProduct;
}

export async function deleteSupplierProduct(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteSupplierProduct: boolean }>(
    DELETE_SUPPLIER_PRODUCT_MUTATION,
    { id },
  );
  return data.deleteSupplierProduct;
}
