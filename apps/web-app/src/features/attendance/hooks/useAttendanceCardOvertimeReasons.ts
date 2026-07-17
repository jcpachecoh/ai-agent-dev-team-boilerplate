import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listEmployeeCatalogOptions } from '@/features/payroll/api/payroll.client';
import type { EmployeeCatalogOption } from '@/features/payroll/types/employee-catalog.types';

/**
 * Resuelve nombres de OVERTIME_REASON para la Tarjeta (incluye inactivos vía FK).
 * `retry: false` evita romper la tarjeta si el rol no puede listar catálogos.
 */
export function useAttendanceCardOvertimeReasons(
  enabled: boolean,
  includeInactive: boolean,
): UseQueryResult<EmployeeCatalogOption[]> {
  return useQuery({
    queryKey: ['attendance', 'card', 'overtime-reasons', includeInactive] as const,
    queryFn: () => listEmployeeCatalogOptions('OVERTIME_REASON', includeInactive),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
