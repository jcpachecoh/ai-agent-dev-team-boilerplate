import type { ListProductionOrdersFilters } from '../types';

export const produccionKeys = {
  all: ['produccion'] as const,
  orders: (filters: ListProductionOrdersFilters) =>
    [...produccionKeys.all, 'orders', filters] as const,
  order: (id: string) => [...produccionKeys.all, 'order', id] as const,
  recipes: () => [...produccionKeys.all, 'recipes'] as const,
};
