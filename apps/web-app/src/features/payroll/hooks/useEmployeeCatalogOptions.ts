import { useQuery } from '@tanstack/react-query';

import { listEmployeeCatalogOptions } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type { EmployeeCatalogOption, EmployeeCatalogType } from '../types/employee-catalog.types';

export function useEmployeeCatalogOptions(type?: EmployeeCatalogType) {
  return useQuery({
    queryKey: payrollKeys.catalogList(type),
    queryFn: () => listEmployeeCatalogOptions(type),
    staleTime: 5 * 60 * 1000,
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
