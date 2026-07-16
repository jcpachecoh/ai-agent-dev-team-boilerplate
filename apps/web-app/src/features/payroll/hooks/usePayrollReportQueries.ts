import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getAttendanceReport, getPayrollReport, getSenaQuota } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  AttendanceReportQuery,
  AttendanceReportResponse,
  PayrollReportQuery,
  PayrollReportResponse,
  SenaQuotaResponse,
} from '../types/payroll-reports.types';

export function usePayrollReportQuery(
  query: PayrollReportQuery,
): UseQueryResult<PayrollReportResponse> {
  return useQuery({
    queryKey: payrollKeys.payrollReport(query),
    queryFn: () => getPayrollReport(query),
  });
}

export function useAttendanceReportQuery(
  query: AttendanceReportQuery,
  enabled = true,
): UseQueryResult<AttendanceReportResponse> {
  return useQuery({
    queryKey: payrollKeys.attendanceReport(query),
    queryFn: () => getAttendanceReport(query),
    enabled,
  });
}

/** OS-599 — cuota SENA estimada para el período del dashboard (YYYY-MM). */
export function useSenaQuotaQuery(period: string): UseQueryResult<SenaQuotaResponse> {
  return useQuery({
    queryKey: payrollKeys.senaQuota(period),
    queryFn: () => getSenaQuota(period),
    enabled: /^\d{4}-(0[1-9]|1[0-2])$/.test(period),
  });
}
