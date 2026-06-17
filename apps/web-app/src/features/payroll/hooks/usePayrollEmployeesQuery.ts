import { useQuery } from '@tanstack/react-query';

import { listPayrollEmployees } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type { PayrollEmployeesFilters } from '../types/payroll.types';

export function usePayrollEmployeesQuery(filters: PayrollEmployeesFilters) {
  return useQuery({
    queryKey: payrollKeys.employeeList(filters),
    queryFn: async () => {
      const employees = await listPayrollEmployees(filters);
      // #region agent log
      const sample = employees[0];
      fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0046ac' },
        body: JSON.stringify({
          sessionId: '0046ac',
          runId: 'pre-fix',
          hypothesisId: 'D',
          location: 'usePayrollEmployeesQuery.ts:queryFn',
          message: 'Employees list API sample',
          data: {
            count: employees.length,
            sampleLocationId: sample?.locationId ?? null,
            sampleLocationName: sample?.location?.name ?? null,
            hasLocationOnAny: employees.some((e) => Boolean(e.location?.name)),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return employees;
    },
  });
}
