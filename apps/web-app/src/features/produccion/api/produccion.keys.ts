import type { ListProductionCommitteesFilters, ListProductionOrdersFilters } from '../types';

export const produccionKeys = {
  all: ['produccion'] as const,
  orders: (filters: ListProductionOrdersFilters) =>
    [...produccionKeys.all, 'orders', filters] as const,
  order: (id: string) => [...produccionKeys.all, 'order', id] as const,
  recipes: () => [...produccionKeys.all, 'recipes'] as const,
  committees: (filters: ListProductionCommitteesFilters) =>
    [...produccionKeys.all, 'committees', filters] as const,
  committee: (id: string) => [...produccionKeys.all, 'committee', id] as const,
  operationsAdminUsers: () => [...produccionKeys.all, 'operations-admin-users'] as const,
};
