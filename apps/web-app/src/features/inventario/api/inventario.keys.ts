import type { SupplyItemsListFilters } from '../types';

export const inventarioKeys = {
  all: ['inventario'] as const,
  categories: (scope: 'active' | 'all' = 'active') =>
    [...inventarioKeys.all, 'categories', scope] as const,
  items: (filters: SupplyItemsListFilters) => [...inventarioKeys.all, 'items', filters] as const,
  item: (id: string) => [...inventarioKeys.all, 'item', id] as const,
  suppliers: (id: string) => [...inventarioKeys.all, 'suppliers', id] as const,
  priceHistory: (id: string) => [...inventarioKeys.all, 'price-history', id] as const,
  dashboard: () => [...inventarioKeys.all, 'dashboard'] as const,
  alerts: () => [...inventarioKeys.all, 'alerts'] as const,
  alertSummary: () => [...inventarioKeys.all, 'alert-summary'] as const,
  report: (type: string, from: string, to: string) =>
    [...inventarioKeys.all, 'report', type, from, to] as const,
};
