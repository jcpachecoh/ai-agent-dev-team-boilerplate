import { graphqlRequest } from '@/lib/graphql-client';

import {
  SUPPLY_CATEGORY_FIELDS,
  SUPPLY_ITEM_FIELDS,
  SUPPLY_ITEM_PRICE_HISTORY_FIELDS,
  SUPPLY_ITEM_SUPPLIER_FIELDS,
} from './inventario.fragments';
import type {
  PriceHistoryEntryApi,
  SupplyCategoryApi,
  SupplyItemApi,
  SupplyItemSupplierApi,
  SupplyItemsListFilters,
} from '../types';

export const SUPPLY_CATEGORIES_QUERY = `
  query SupplyCategories($isActive: Boolean) {
    supplyCategories(isActive: $isActive) {
      ${SUPPLY_CATEGORY_FIELDS}
    }
  }
`;

export const SUPPLY_ITEMS_QUERY = `
  query SupplyItems(
    $search: String
    $categoriaId: ID
    $isActive: Boolean
    $limit: Int
    $offset: Int
  ) {
    supplyItems(
      search: $search
      categoriaId: $categoriaId
      isActive: $isActive
      limit: $limit
      offset: $offset
    ) {
      ${SUPPLY_ITEM_FIELDS}
    }
  }
`;

export const SUPPLY_ITEM_QUERY = `
  query SupplyItem($id: ID!) {
    supplyItem(id: $id) {
      ${SUPPLY_ITEM_FIELDS}
    }
  }
`;

export const SUPPLY_ITEM_SUPPLIERS_QUERY = `
  query SupplyItemSuppliers($supplyItemId: ID!) {
    supplyItemSuppliers(supplyItemId: $supplyItemId) {
      ${SUPPLY_ITEM_SUPPLIER_FIELDS}
    }
  }
`;

export const SUPPLY_ITEM_PRICE_HISTORY_QUERY = `
  query SupplyItemPriceHistory($supplyItemId: ID!, $limit: Int) {
    supplyItemPriceHistory(supplyItemId: $supplyItemId, limit: $limit) {
      ${SUPPLY_ITEM_PRICE_HISTORY_FIELDS}
    }
  }
`;

export async function fetchSupplyCategoriesGql(isActive?: boolean): Promise<SupplyCategoryApi[]> {
  const data = await graphqlRequest<{ supplyCategories: SupplyCategoryApi[] }>(
    SUPPLY_CATEGORIES_QUERY,
    isActive === undefined ? undefined : { isActive },
  );
  return data.supplyCategories;
}

export async function fetchSupplyItemsGql(
  filters: SupplyItemsListFilters = {},
): Promise<SupplyItemApi[]> {
  const data = await graphqlRequest<{ supplyItems: SupplyItemApi[] }>(SUPPLY_ITEMS_QUERY, {
    search: filters.search?.trim() || undefined,
    categoriaId: filters.categoriaId || undefined,
    isActive: filters.isActive ?? true,
    limit: 200,
    offset: 0,
  });
  return data.supplyItems;
}

export async function fetchSupplyItemGql(id: string): Promise<SupplyItemApi | null> {
  const data = await graphqlRequest<{ supplyItem: SupplyItemApi | null }>(SUPPLY_ITEM_QUERY, {
    id,
  });
  return data.supplyItem;
}

export async function fetchSupplyItemSuppliersGql(
  supplyItemId: string,
): Promise<SupplyItemSupplierApi[]> {
  const data = await graphqlRequest<{ supplyItemSuppliers: SupplyItemSupplierApi[] }>(
    SUPPLY_ITEM_SUPPLIERS_QUERY,
    { supplyItemId },
  );
  return data.supplyItemSuppliers;
}

export async function fetchSupplyItemPriceHistoryGql(
  supplyItemId: string,
): Promise<PriceHistoryEntryApi[]> {
  const data = await graphqlRequest<{ supplyItemPriceHistory: PriceHistoryEntryApi[] }>(
    SUPPLY_ITEM_PRICE_HISTORY_QUERY,
    { supplyItemId, limit: 50 },
  );
  return data.supplyItemPriceHistory;
}

export async function checkCodigoInternoExistsGql(
  codigoInterno: string,
  excludeId?: string,
): Promise<boolean> {
  const items = await fetchSupplyItemsGql({ search: codigoInterno, isActive: undefined });
  return items.some(
    (item) =>
      item.codigoInterno.toLowerCase() === codigoInterno.toLowerCase() && item.id !== excludeId,
  );
}
