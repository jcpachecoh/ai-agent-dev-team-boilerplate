import { useMemo } from 'react';

import { buildLaborClassificationByUserId } from '../utils/labor-classification';
import { useAttendanceCollaboratorsEmployeesQuery } from './useAttendanceCollaboratorsEmployeesQuery';

export function useLaborClassificationLookup() {
  const employeesQuery = useAttendanceCollaboratorsEmployeesQuery();

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
