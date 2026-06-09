import { graphqlRequest } from '@/lib/graphql-client';

import {
  SUPPLIER_FIELDS,
  SUPPLIER_PRODUCT_FIELDS,
  SUPPLY_ITEM_FIELDS,
} from './proveedores.fragments';
import type {
  SupplierApiModel,
  SupplierListFilters,
  SupplierProductApiModel,
  SupplyItemApiModel,
} from '../types';

export const SUPPLIERS_QUERY = `
  query Suppliers($filter: String, $isActive: Boolean, $condicionPago: String, $limit: Int, $offset: Int) {
    suppliers(filter: $filter, isActive: $isActive, condicionPago: $condicionPago, limit: $limit, offset: $offset) {
      ${SUPPLIER_FIELDS}
    }
  }
`;

export const SUPPLIER_QUERY = `
  query Supplier($id: ID!) {
    supplier(id: $id) {
      ${SUPPLIER_FIELDS}
    }
  }
`;

export const SUPPLIER_PRODUCTS_QUERY = `
  query SupplierProducts($supplierId: ID!) {
    supplierProducts(supplierId: $supplierId) {
      ${SUPPLIER_PRODUCT_FIELDS}
    }
  }
`;

export const SUPPLY_ITEMS_QUERY = `
  query SupplyItems($search: String, $limit: Int) {
    supplyItems(search: $search, limit: $limit) {
      ${SUPPLY_ITEM_FIELDS}
    }
  }
`;

export async function fetchSuppliers(filters: SupplierListFilters): Promise<SupplierApiModel[]> {
  const variables: Record<string, unknown> = {
    filter: filters.search?.trim() || undefined,
    limit: 200,
  };

  if (filters.isActive !== undefined) {
    variables.isActive = filters.isActive;
  }
  if (filters.condicionPago) {
    variables.condicionPago = filters.condicionPago;
  }

  const data = await graphqlRequest<{ suppliers: SupplierApiModel[] }>(SUPPLIERS_QUERY, variables);
  return data.suppliers;
}

export async function fetchSupplier(id: string): Promise<SupplierApiModel | null> {
  const data = await graphqlRequest<{ supplier: SupplierApiModel | null }>(SUPPLIER_QUERY, { id });
  return data.supplier;
}

export async function fetchSupplierProducts(
  supplierId: string,
): Promise<SupplierProductApiModel[]> {
  const data = await graphqlRequest<{ supplierProducts: SupplierProductApiModel[] }>(
    SUPPLIER_PRODUCTS_QUERY,
    { supplierId },
  );
  return data.supplierProducts;
}

export async function fetchSupplyItems(search: string): Promise<SupplyItemApiModel[]> {
  const data = await graphqlRequest<{ supplyItems: SupplyItemApiModel[] }>(SUPPLY_ITEMS_QUERY, {
    search: search.trim() || undefined,
    limit: 50,
  });
  return data.supplyItems;
}
