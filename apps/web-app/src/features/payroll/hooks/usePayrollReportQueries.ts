import { useQuery } from '@tanstack/react-query';

import { getAttendanceReport, getPayrollReport } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type { AttendanceReportQuery, PayrollReportQuery } from '../types/payroll-reports.types';

export function usePayrollReportQuery(query: PayrollReportQuery) {
  return useQuery({
    queryKey: payrollKeys.payrollReport(query),
    queryFn: () => getPayrollReport(query),
  });
}

export function useAttendanceReportQuery(query: AttendanceReportQuery, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.attendanceReport(query),
    queryFn: () => getAttendanceReport(query),
    enabled,
  });
}
