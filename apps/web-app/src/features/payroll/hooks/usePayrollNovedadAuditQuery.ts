import { useQuery } from '@tanstack/react-query';

import { fetchPayrollNovedadAuditLog } from '../api/payroll-novedades.client';
import { payrollKeys } from '../api/queryKeys';

export function usePayrollNovedadAuditQuery(novedadId: string | null, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.payrollNovedadAudit(novedadId ?? ''),
    queryFn: () => fetchPayrollNovedadAuditLog(novedadId!),
    enabled: enabled && Boolean(novedadId),
    staleTime: 30 * 1000,
  });
}
