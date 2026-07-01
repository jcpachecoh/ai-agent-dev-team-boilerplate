import { useQuery } from '@tanstack/react-query';

import { listAllPayrollEmployees } from '@/features/payroll/api/payroll.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';

const ATTENDANCE_COLLABORATORS_FILTERS = {
  includeInactive: true,
} as const;

export function useAttendanceCollaboratorsEmployeesQuery() {
  return useQuery({
    queryKey: [...payrollKeys.employees(), 'all-pages', ATTENDANCE_COLLABORATORS_FILTERS],
    queryFn: () => listAllPayrollEmployees(ATTENDANCE_COLLABORATORS_FILTERS),
  });
}
