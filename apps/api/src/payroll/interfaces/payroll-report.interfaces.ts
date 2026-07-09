import { ArlRiskLevel, EmployeeContractType, SalaryType } from '@prisma/client';
import { AttendanceOvertimeType } from '../payroll.constants';

// ── Input types (already hydrated — no DB access in PayrollCalculationService) ─

export interface EmployeePayrollInput {
  employeeId: string;
  userId: string;
  tenantId: string;
  locationId: string;
  contractType: EmployeeContractType;
  salaryType: SalaryType;
  /** Monthly salary in COP (integer) */
  salaryAmount: number;
  /** True when salary ≤ 2 SMLV — already validated by PayrollService on create/update */
  hasTransportSubsidy: boolean;
  arlRiskLevel: ArlRiskLevel;
}

export interface AttendanceMonthSummary {
  employeeId: string;
  period: { year: number; month: number };
  /** Days with at least one complete ENTRY/EXIT pair in the period */
  presentDays: number;
  /** Calendar days absent (informational, not used in payroll math) */
  absentDays: number;
  totalWorkedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  /**
   * Overtime minutes classified by type.
   * GAP(Task04): FESTIVO_* will be 0 until the Colombian festivos calendar is implemented.
   * In Task01, callers may populate DIURNO/NOCTURNO based on AttendanceService.isNocturno.
   */
  overtimeByType: Partial<Record<AttendanceOvertimeType, number>>;
}

/**
 * Legal rates resolved from LaborLegalParametersService for the period being calculated.
 * Resolved once per report run (not per employee) — see ReportsService.getPayrollReport,
 * which preloads these "as of" the period's last day before looping over employees.
 */
export interface PayrollLegalRates {
  smlv: number;
  transportSubsidyThreshold: number;
  transportSubsidy: number;
  recargoDominicalFestivo: number;
}

// ── Output types ─────────────────────────────────────────────────────────────

export interface OvertimeBreakdownItem {
  type: AttendanceOvertimeType;
  minutes: number;
  /** COP per ordinary hour (salaryAmount / 240) */
  hourlyRate: number;
  /** Surcharge multiplier: 0.25, 0.75, 1.10, etc. */
  surchargeRate: number;
  /** COP amount for this overtime type in the period */
  amount: number;
}

export interface EmployeePayrollPeriod {
  employeeId: string;
  userId: string;
  tenantId: string;
  locationId: string;
  period: { year: number; month: number };
  contractType: EmployeeContractType;
  salaryType: SalaryType;
  /** Full monthly salary amount (not prorated) */
  salaryAmount: number;
  workedDays: number;
  calendarDays: number;

  // ── Devengos ───────────────────────────────────────────────────────────────
  /** Salary prorated to workedDays/calendarDays (COP) */
  salaryBase: number;
  /** Transport subsidy prorated to workedDays/calendarDays; 0 if not applicable (COP) */
  transportSubsidy: number;
  /** Sum of all overtime surcharge amounts (COP) */
  overtimePay: number;
  overtimeBreakdown: OvertimeBreakdownItem[];
  /** salaryBase + transportSubsidy + overtimePay (COP) */
  grossPay: number;

  // ── Deducciones empleado ───────────────────────────────────────────────────
  /** 4% of contributionBase (COP) */
  healthDeduction: number;
  /** 4% of contributionBase (COP) */
  pensionDeduction: number;
  /**
   * Income tax withholding.
   * GAP(Task04): always 0 — Ley 2277/2022 progressive UVT ranges not yet implemented.
   */
  incomeTaxWithholding: number;
  /** healthDeduction + pensionDeduction + incomeTaxWithholding (COP) */
  totalDeductions: number;

  // ── Neto empleado ─────────────────────────────────────────────────────────
  /** grossPay − totalDeductions (COP) */
  netPay: number;

  // ── Aportes patronales ────────────────────────────────────────────────────
  /** 8.5% of contributionBase; 0 for PRESTACION/APRENDIZAJE (COP) */
  employerHealthContribution: number;
  /** 12% of contributionBase; 0 for PRESTACION/APRENDIZAJE (COP) */
  employerPensionContribution: number;
  /** ARL rate × contributionBase; 0 for PRESTACION/APRENDIZAJE (COP) */
  employerArlContribution: number;
  /** 2% of contributionBase; 0 for PRESTACION/APRENDIZAJE (COP) */
  employerSenaContribution: number;
  /** 3% of contributionBase; 0 for PRESTACION/APRENDIZAJE (COP) */
  employerIcbfContribution: number;
  /** 4% of contributionBase; 0 for PRESTACION/APRENDIZAJE (COP) */
  employerCajaContribution: number;
  /** Sum of all employer contributions (COP) */
  totalEmployerContributions: number;

  // ── Costo total nómina ────────────────────────────────────────────────────
  /** grossPay + totalEmployerContributions (COP) */
  totalPayrollCost: number;
}

export interface LocationPayrollSummary {
  locationId: string;
  employeeCount: number;
  totalNetPay: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
}

export interface TenantPayrollSummary {
  tenantId: string;
  period: { year: number; month: number };
  employeeCount: number;
  totalNetPay: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
  byLocation: LocationPayrollSummary[];
}
