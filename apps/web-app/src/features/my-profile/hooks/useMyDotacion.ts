import { useEmployeeDotacionHistoryQuery } from '@/features/payroll/hooks/useDotacionesQuery';

export function useMyDotacion(employeeId: string | undefined) {
  return useEmployeeDotacionHistoryQuery(employeeId);
}
