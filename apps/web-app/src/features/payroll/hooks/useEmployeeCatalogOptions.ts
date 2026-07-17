import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createEmployeeCatalogOption,
  deactivateEmployeeCatalogOption,
  listEmployeeCatalogOptions,
  updateEmployeeCatalogOption,
} from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  CreateEmployeeCatalogOptionInput,
  EmployeeCatalogOption,
  EmployeeCatalogType,
  UpdateEmployeeCatalogOptionInput,
} from '../types/employee-catalog.types';

/** Active-only list — forms de solicitud / nómina (sin permiso de edición). */
export function useEmployeeCatalogOptions(type?: EmployeeCatalogType) {
  return useQuery({
    queryKey: payrollKeys.catalogList(type, false),
    queryFn: () => listEmployeeCatalogOptions(type, false),
    staleTime: 5 * 60 * 1000,
  });
}

/** Admin: incluye inactivos. Escritura vía PAYROLL_WRITE_ROLES (no overtime.request). */
export function useEmployeeCatalogAdminOptions(type?: EmployeeCatalogType) {
  return useQuery({
    queryKey: payrollKeys.catalogList(type, true),
    queryFn: () => listEmployeeCatalogOptions(type, true),
    staleTime: 30 * 1000,
  });
}

export function useCreateEmployeeCatalogOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeCatalogOptionInput) => createEmployeeCatalogOption(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.catalogs() });
    },
  });
}

export function useUpdateEmployeeCatalogOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeCatalogOptionInput }) =>
      updateEmployeeCatalogOption(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.catalogs() });
    },
  });
}

export function useDeactivateEmployeeCatalogOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateEmployeeCatalogOption(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.catalogs() });
    },
  });
}

export function groupCatalogOptionsByType(
  options: EmployeeCatalogOption[],
): Record<EmployeeCatalogType, EmployeeCatalogOption[]> {
  return options.reduce(
    (acc, option) => {
      acc[option.type] = [...(acc[option.type] ?? []), option];
      return acc;
    },
    {} as Record<EmployeeCatalogType, EmployeeCatalogOption[]>,
  );
}

export function useEmployeeCatalogsGrouped() {
  const query = useEmployeeCatalogOptions();

  const grouped = groupCatalogOptionsByType(query.data ?? []);

  return {
    ...query,
    grouped,
  };
}

export function buildCatalogSelectOptions(
  catalogOptions: EmployeeCatalogOption[],
  currentValue: string,
): Array<{ value: string; label: string }> {
  const options = catalogOptions.map((option) => ({
    value: option.name,
    label: option.name,
  }));

  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: currentValue });
  }

  return options;
}

export function catalogSelectPlaceholder(
  loading: boolean,
  hasOptions: boolean,
  loadingLabel = 'Cargando opciones...',
  emptyLabel = 'No hay opciones configuradas',
  defaultLabel = 'Seleccionar',
  hasError = false,
): string {
  if (loading) return loadingLabel;
  if (hasError) return 'Error al cargar opciones';
  if (!hasOptions) return emptyLabel;
  return defaultLabel;
}
