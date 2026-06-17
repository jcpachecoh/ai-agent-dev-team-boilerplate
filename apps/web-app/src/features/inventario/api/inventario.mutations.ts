import { graphqlRequest } from '@/lib/graphql-client';

import { SUPPLY_CATEGORY_FIELDS, SUPPLY_ITEM_FIELDS } from './inventario.fragments';
import type {
  CreateSupplyItemInput,
  SupplyCategoryApi,
  SupplyItemApi,
  UpdateSupplyItemInput,
} from '../types';

export const CREATE_SUPPLY_ITEM_MUTATION = `
  mutation CreateSupplyItem($input: CreateSupplyItemInput!) {
    createSupplyItem(input: $input) {
      ${SUPPLY_ITEM_FIELDS}
    }
  }
`;

export const UPDATE_SUPPLY_ITEM_MUTATION = `
  mutation UpdateSupplyItem($id: ID!, $input: UpdateSupplyItemInput!) {
    updateSupplyItem(id: $id, input: $input) {
      ${SUPPLY_ITEM_FIELDS}
    }
  }
`;

export const DELETE_SUPPLY_ITEM_MUTATION = `
  mutation DeleteSupplyItem($id: ID!) {
    deleteSupplyItem(id: $id)
  }
`;

export const CREATE_SUPPLY_CATEGORY_MUTATION = `
  mutation CreateSupplyCategory($input: CreateSupplyCategoryInput!) {
    createSupplyCategory(input: $input) {
      ${SUPPLY_CATEGORY_FIELDS}
    }
  }
`;

export const UPDATE_SUPPLY_CATEGORY_MUTATION = `
  mutation UpdateSupplyCategory($id: ID!, $input: UpdateSupplyCategoryInput!) {
    updateSupplyCategory(id: $id, input: $input) {
      ${SUPPLY_CATEGORY_FIELDS}
    }
  }
`;

export async function createSupplyItemGql(input: CreateSupplyItemInput): Promise<SupplyItemApi> {
  const data = await graphqlRequest<{ createSupplyItem: SupplyItemApi }>(
    CREATE_SUPPLY_ITEM_MUTATION,
    { input },
  );
  return data.createSupplyItem;
}

export async function updateSupplyItemGql(
  id: string,
  input: UpdateSupplyItemInput,
): Promise<SupplyItemApi> {
  const data = await graphqlRequest<{ updateSupplyItem: SupplyItemApi }>(
    UPDATE_SUPPLY_ITEM_MUTATION,
    { id, input },
  );
  return data.updateSupplyItem;
}

export async function deleteSupplyItemGql(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteSupplyItem: boolean }>(DELETE_SUPPLY_ITEM_MUTATION, {
    id,
  });
  return data.deleteSupplyItem;
}

export async function createSupplyCategoryGql(input: {
  nombre: string;
  prefijo: string;
  descripcion?: string;
}): Promise<SupplyCategoryApi> {
  const data = await graphqlRequest<{ createSupplyCategory: SupplyCategoryApi }>(
    CREATE_SUPPLY_CATEGORY_MUTATION,
    { input },
  );
  return data.createSupplyCategory;
}

export async function updateSupplyCategoryGql(
  id: string,
  input: { nombre?: string; prefijo?: string; descripcion?: string; isActive?: boolean },
): Promise<SupplyCategoryApi> {
  const data = await graphqlRequest<{ updateSupplyCategory: SupplyCategoryApi }>(
    UPDATE_SUPPLY_CATEGORY_MUTATION,
    { id, input },
  );
  return data.updateSupplyCategory;
}
