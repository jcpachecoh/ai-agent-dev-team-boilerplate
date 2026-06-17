import { isGraphqlConfigured } from '@/lib/graphql-client';

import type {
  CreateSupplyItemInput,
  PriceHistoryEntryApi,
  SupplyCategoryApi,
  SupplyItemApi,
  SupplyItemSupplierApi,
  SupplyItemsListFilters,
  UpdateSupplyItemInput,
} from '../types';
import {
  checkCodigoInternoExistsGql,
  fetchSupplyCategoriesGql,
  fetchSupplyItemGql,
  fetchSupplyItemPriceHistoryGql,
  fetchSupplyItemSuppliersGql,
  fetchSupplyItemsGql,
  fetchNextSupplyItemCodigoGql,
} from './inventario.queries';
import {
  createSupplyCategoryGql,
  createSupplyItemGql,
  deleteSupplyItemGql,
  updateSupplyCategoryGql,
  updateSupplyItemGql,
} from './inventario.mutations';
import {
  checkCodigoInternoExists as checkCodigoInternoRest,
  createSupplyItem as createSupplyItemRest,
  deactivateSupplyItem as deactivateSupplyItemRest,
  createSupplyCategory as createSupplyCategoryRest,
  fetchSupplyCategories as fetchSupplyCategoriesRest,
  updateSupplyCategory as updateSupplyCategoryRest,
  fetchSupplyItem as fetchSupplyItemRest,
  fetchSupplyItemPriceHistory as fetchSupplyItemPriceHistoryRest,
  fetchSupplyItemSuppliers as fetchSupplyItemSuppliersRest,
  fetchSupplyItems as fetchSupplyItemsRest,
  fetchNextSupplyItemCodigo as fetchNextSupplyItemCodigoRest,
  updateSupplyItem as updateSupplyItemRest,
} from './inventario.rest';

export function useInventarioGraphql(): boolean {
  return isGraphqlConfigured();
}

export function fetchSupplyCategories(isActive?: boolean): Promise<SupplyCategoryApi[]> {
  if (isGraphqlConfigured()) return fetchSupplyCategoriesGql(isActive);
  return fetchSupplyCategoriesRest(isActive);
}

export function createSupplyCategory(input: {
  nombre: string;
  prefijo: string;
  descripcion?: string;
}): Promise<SupplyCategoryApi> {
  if (isGraphqlConfigured()) return createSupplyCategoryGql(input);
  return createSupplyCategoryRest(input);
}

export function updateSupplyCategory(
  id: string,
  input: { nombre?: string; prefijo?: string; descripcion?: string; isActive?: boolean },
): Promise<SupplyCategoryApi> {
  if (isGraphqlConfigured()) return updateSupplyCategoryGql(id, input);
  return updateSupplyCategoryRest(id, input);
}

export function fetchNextSupplyItemCodigo(categoriaId: string): Promise<string> {
  if (isGraphqlConfigured()) return fetchNextSupplyItemCodigoGql(categoriaId);
  return fetchNextSupplyItemCodigoRest(categoriaId);
}

export function fetchSupplyItems(filters: SupplyItemsListFilters = {}): Promise<SupplyItemApi[]> {
  if (isGraphqlConfigured()) return fetchSupplyItemsGql(filters);
  return fetchSupplyItemsRest(filters);
}

export function fetchSupplyItem(id: string): Promise<SupplyItemApi | null> {
  if (isGraphqlConfigured()) return fetchSupplyItemGql(id);
  return fetchSupplyItemRest(id).then((item) => item ?? null);
}

export function createSupplyItem(input: CreateSupplyItemInput): Promise<SupplyItemApi> {
  if (isGraphqlConfigured()) return createSupplyItemGql(input);
  return createSupplyItemRest(input);
}

export function updateSupplyItem(id: string, input: UpdateSupplyItemInput): Promise<SupplyItemApi> {
  if (isGraphqlConfigured()) return updateSupplyItemGql(id, input);
  return updateSupplyItemRest(id, input);
}

export function deactivateSupplyItem(id: string): Promise<SupplyItemApi | boolean> {
  if (isGraphqlConfigured()) return deleteSupplyItemGql(id).then(() => true as const);
  return deactivateSupplyItemRest(id);
}

export function checkCodigoInternoExists(
  codigoInterno: string,
  excludeId?: string,
): Promise<boolean> {
  if (isGraphqlConfigured()) return checkCodigoInternoExistsGql(codigoInterno, excludeId);
  return checkCodigoInternoRest(codigoInterno, excludeId);
}

export function fetchSupplyItemSuppliers(id: string): Promise<SupplyItemSupplierApi[]> {
  if (isGraphqlConfigured()) return fetchSupplyItemSuppliersGql(id);
  return fetchSupplyItemSuppliersRest(id);
}

export function fetchSupplyItemPriceHistory(id: string): Promise<PriceHistoryEntryApi[]> {
  if (isGraphqlConfigured()) return fetchSupplyItemPriceHistoryGql(id);
  return fetchSupplyItemPriceHistoryRest(id);
}
