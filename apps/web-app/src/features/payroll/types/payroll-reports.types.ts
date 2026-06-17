export interface PayrollReportPeriod {
  year: number;
  month: number;
}

export interface PayrollReportLocationTotals {
  locationId: string;
  locationName: string;
  employeeCount: number;
  totalNetPay: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
}

export interface PayrollReportTenantTotals {
  employeeCount: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
}

export interface PayrollReportResponse {
  tenantId: string;
  period: PayrollReportPeriod;
  tenantTotals: PayrollReportTenantTotals;
  locationTotals: PayrollReportLocationTotals[];
}

export interface AttendanceReportEmployeeRow {
  employeeId: string;
  employeeName: string;
  locationId: string;
  locationName: string;
  totalWorkedMinutes: number;
  overtimeMinutes: number;
  exceededLegalOvertimeLimit: boolean;
}

export interface AttendanceReportResponse {
  tenantId: string;
  from: string;
  to: string;
  employees: AttendanceReportEmployeeRow[];
}

export type PayrollReportExportFormat = 'PDF' | 'XLSX';

export interface PayrollReportQuery {
  period: string;
  locationId?: string;
}

export interface AttendanceReportQuery {
  from: string;
  to: string;
  locationId?: string;
}
