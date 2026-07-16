export interface TaxWithholdingBreakdown {
  taxWithholdingBase: number;
  uvtValue: number;
  taxWithholdingBaseUvt: number;
  bracketLowerUvtExclusive: number | null;
  bracketUpperUvtInclusive: number | null;
  marginalRate: number | null;
  fixedTaxUvt: number | null;
  incomeTaxWithholding: number;
  isExemptFromTax: boolean;
}

export interface OvertimeBreakdownItem {
  type: string;
  minutes: number;
  hourlyRate: number;
  surchargeRate: number;
  amount: number;
}

export interface PayrollReportEmployeeRow {
  employeeId: string;
  employeeName: string;
  cedula: string;
  locationId: string;
  locationName: string;
  contractType: string;
  salaryType: string;
  salaryAmount: number;
  workedDays: number;
  calendarDays: number;
  salaryBase: number;
  transportSubsidy: number;
  overtimePay: number;
  overtimeBreakdown: OvertimeBreakdownItem[];
  grossPay: number;
  healthDeduction: number;
  pensionDeduction: number;
  incomeTaxWithholding: number;
  taxWithholdingBreakdown: TaxWithholdingBreakdown;
  totalDeductions: number;
  netPay: number;
  employerHealthContribution: number;
  employerPensionContribution: number;
  employerArlContribution: number;
  employerSenaContribution: number;
  employerIcbfContribution: number;
  employerCajaContribution: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
  medicalLeaveEmployerDays: number;
  medicalLeaveEmployerPay: number;
  medicalLeaveEpsArlDays: number;
  medicalLeaveEpsArlPay: number;
  medicalLeaveOrdinaryDaysExcluded: number;
}

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
  employees: PayrollReportEmployeeRow[];
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

export type EmployeeListReportType = 'EMPLOYEES' | 'CONTRACTS';

export type AttendanceReportStatusFilter = 'ALL' | 'PRESENT' | 'ABSENT' | 'LATE';

export interface PayrollReportQuery {
  period: string;
  locationId?: string;
  employeeId?: string;
  contractType?: string;
}

export interface AttendanceReportQuery {
  from: string;
  to: string;
  locationId?: string;
  employeeId?: string;
  status?: AttendanceReportStatusFilter;
}

export interface EmployeeListExportQuery {
  reportType?: EmployeeListReportType;
  locationId?: string;
  employeeId?: string;
  positionId?: string;
  area?: string;
  department?: string;
  contractType?: string;
  isActive?: boolean;
  search?: string;
}

export interface AttendanceExportQuery extends AttendanceReportQuery {}
