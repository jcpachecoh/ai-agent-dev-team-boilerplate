import { ArlRiskLevel, EmployeeContractType, SalaryType } from '@prisma/client';
import { AttendanceOvertimeType } from '../payroll.constants';

// ── Input types (already hydrated — no DB access in PayrollCalculationService) ─

export interface EmployeePayrollInput {
  employeeId: string;
  userId: string;
  tenantId: string;
  /** null para empleados con costCenter = ROTANTE (CONN-06) — sin sede fija en ficha. */
  locationId: string | null;
  contractType: EmployeeContractType;
  salaryType: SalaryType;
  /** Monthly salary in COP (integer) */
  salaryAmount: number;
  /** True when salary ≤ 2 SMLV — already validated by PayrollService on create/update */
  hasTransportSubsidy: boolean;
  arlRiskLevel: ArlRiskLevel;
  medicalLeaveEmployerDays?: number;
  medicalLeaveEmployerPay?: number;
  medicalLeaveEpsArlDays?: number;
  medicalLeaveEpsArlPay?: number;
  medicalLeaveOrdinaryDaysExcluded?: number;
  payrollNovedadUnpaidDays?: number;
  payrollNovedadUnpaidDeduction?: number;
  payrollNovedadPaidDays?: number;
}

/**
 * Overtime minutes for one (type, monthlyHoursBase, surchargeRate) bucket. Both rates are
 * resolved by the caller as of the calendar date the minutes were actually worked (OS-586) —
 * NOT a single flat value for the whole payroll period. A type can appear more than once if
 * the underlying legal parameters change mid-period (e.g. JORNADA_MAX_SEMANAL steps down on
 * July 15 each year, which does not align to a calendar-month payroll period boundary).
 */
export type OvertimeMinutesEntry = {
  type: AttendanceOvertimeType;
  minutes: number;
  /** JORNADA_MAX_SEMANAL(date) × 5 — see LaborLegalParametersService.getValueAt (OS-586). */
  monthlyHoursBase: number;
  /** RECARGO_DOMINICAL_FESTIVO / RECARGO_HORA_EXTRA_DIURNA|NOCTURNA(date), combined for FESTIVO_NOCTURNO. */
  surchargeRate: number;
};

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
   * Overtime minutes classified by type, each bucket carrying its own already-resolved rates.
   * GAP(Task04): FESTIVO_* will be 0 until the Colombian festivos calendar is implemented.
   * GAP(OS-586): resolved by CONN-04a — ReportsService.applyOvertimeApprovalGate excludes
   * non-approved overtime before PayrollCalculationService consumes this summary.
   */
  overtimeEntries: OvertimeMinutesEntry[];
}

/**
 * Legal rates resolved from LaborLegalParametersService for the period being calculated.
 * Resolved once per report run (not per employee) — see ReportsService.getPayrollReport.
 * Only period-level (not date-varying-within-period) values live here; overtime surcharges
 * and the hourly-rate divisor are resolved per work-day date instead — see OvertimeMinutesEntry.
 */
export interface PayrollLegalRates {
  smlv: number;
  transportSubsidyThreshold: number;
  transportSubsidy: number;
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
  /** null para empleados con costCenter = ROTANTE (CONN-06) — sin sede fija en ficha. */
  locationId: string | null;
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
  /** salaryBase + transportSubsidy + overtimePay + medicalLeaveEmployerPay (COP) */
  grossPay: number;
  medicalLeaveEmployerDays: number;
  medicalLeaveEmployerPay: number;
  medicalLeaveEpsArlDays: number;
  medicalLeaveEpsArlPay: number;
  medicalLeaveOrdinaryDaysExcluded: number;
  payrollNovedadUnpaidDays: number;
  payrollNovedadUnpaidDeduction: number;
  payrollNovedadPaidDays: number;

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
