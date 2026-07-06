import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listAllPayrollEmployees } from '@/features/payroll/api/payroll.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';

import { buildLaborClassificationByUserId } from '../utils/labor-classification';

const LABOR_CLASSIFICATION_LOOKUP_FILTERS = { includeInactive: true } as const;

export function useLaborClassificationLookup() {
  const employeesQuery = useQuery({
    queryKey: [...payrollKeys.employees(), 'all-pages', LABOR_CLASSIFICATION_LOOKUP_FILTERS],
    queryFn: () => listAllPayrollEmployees(LABOR_CLASSIFICATION_LOOKUP_FILTERS),
  });

  const lookup = useMemo(
    () => buildLaborClassificationByUserId(employeesQuery.data ?? []),
    [employeesQuery.data],
  );

  return {
    lookup,
    payrollEmployees: employeesQuery.data ?? [],
    isLoading: employeesQuery.isLoading,
    isError: employeesQuery.isError,
  };
}
