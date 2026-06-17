import { Injectable } from '@nestjs/common';
import { EmployeeContractType, SalaryType } from '@prisma/client';
import { AttendanceOvertimeType } from '../payroll.constants';
import {
  ARL_RATES,
  EMPLOYEE_HEALTH_PCT,
  EMPLOYEE_PENSION_PCT,
  EMPLOYER_CAJA_PCT,
  EMPLOYER_HEALTH_PCT,
  EMPLOYER_ICBF_PCT,
  EMPLOYER_PENSION_PCT,
  EMPLOYER_SENA_PCT,
  INTEGRAL_CONTRIBUTIONS_BASE_PCT,
  MONTHLY_HOURS_BASE,
  OVERTIME_SURCHARGE,
  TRANSPORT_SUBSIDY_2025,
  TRANSPORT_SUBSIDY_THRESHOLD,
} from '../payroll.constants';
import {
  AttendanceMonthSummary,
  EmployeePayrollInput,
  EmployeePayrollPeriod,
  OvertimeBreakdownItem,
} from '../interfaces/payroll-report.interfaces';

/** Returns days in a given month — used as calendarDays denominator */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Round to nearest integer COP */
function roundCOP(value: number): number {
  return Math.round(value);
}

/** Contract types that carry no employer social-security contributions */
const EXEMPT_CONTRACT_TYPES = new Set<EmployeeContractType>([
  EmployeeContractType.PRESTACION,
  EmployeeContractType.APRENDIZAJE,
]);

@Injectable()
export class PayrollCalculationService {
  /**
   * Calculates the full payroll period for a single employee.
   * Pure function: no DB access, no side effects.
   *
   * @param employee  Already-hydrated employee data (fetched by the caller)
   * @param attendance Aggregated attendance summary for the period
   */
  calculateEmployeePeriod(
    employee: EmployeePayrollInput,
    attendance: AttendanceMonthSummary,
  ): EmployeePayrollPeriod {
    const { year, month } = attendance.period;
    const calendarDays = daysInMonth(year, month);
    const workedDays = attendance.presentDays;

    const isIntegral = employee.salaryType === SalaryType.INTEGRAL;
    const isExempt = EXEMPT_CONTRACT_TYPES.has(employee.contractType);

    // ── 1. Salary base (prorated) ─────────────────────────────────────────────
    const salaryBase = roundCOP(employee.salaryAmount * (workedDays / calendarDays));

    // ── 2. Contribution base ──────────────────────────────────────────────────
    // INTEGRAL: 70% of prorated salary (CST art. 132 par. 2)
    // ORDINARIO: full prorated salary
    const contributionBase = isIntegral
      ? roundCOP(salaryBase * INTEGRAL_CONTRIBUTIONS_BASE_PCT)
      : salaryBase;

    // ── 3. Transport subsidy (prorated) ───────────────────────────────────────
    // Only when: hasTransportSubsidy flag is set AND salary ≤ 2 SMLV AND not INTEGRAL
    const eligibleForSubsidy =
      employee.hasTransportSubsidy &&
      !isIntegral &&
      employee.salaryAmount <= TRANSPORT_SUBSIDY_THRESHOLD;

    const transportSubsidy = eligibleForSubsidy
      ? roundCOP(TRANSPORT_SUBSIDY_2025 * (workedDays / calendarDays))
      : 0;

    // ── 4. Overtime pay ───────────────────────────────────────────────────────
    // Hourly rate uses full (non-prorated) salary — CST art. 168
    const hourlyRate = employee.salaryAmount / MONTHLY_HOURS_BASE;

    const overtimeBreakdown: OvertimeBreakdownItem[] = [];
    let overtimePay = 0;

    for (const [typeKey, minutes] of Object.entries(attendance.overtimeByType)) {
      const type = typeKey as AttendanceOvertimeType;
      if (!minutes || minutes <= 0) continue;
      const surchargeRate = OVERTIME_SURCHARGE[type] ?? 0;
      if (surchargeRate === 0) continue; // REGULAR — no extra pay

      const hours = minutes / 60;
      const amount = roundCOP(hourlyRate * (1 + surchargeRate) * hours);

      overtimeBreakdown.push({ type, minutes, hourlyRate, surchargeRate, amount });
      overtimePay += amount;
    }

    // ── 5. Gross pay ──────────────────────────────────────────────────────────
    const grossPay = salaryBase + transportSubsidy + overtimePay;

    // ── 6. Employee deductions ────────────────────────────────────────────────
    const healthDeduction = roundCOP(contributionBase * EMPLOYEE_HEALTH_PCT);
    const pensionDeduction = roundCOP(contributionBase * EMPLOYEE_PENSION_PCT);
    // GAP(Task04): retención en la fuente (Ley 2277/2022) — always 0 until Task04
    const incomeTaxWithholding = 0;
    const totalDeductions = healthDeduction + pensionDeduction + incomeTaxWithholding;

    // ── 7. Net pay ────────────────────────────────────────────────────────────
    const netPay = grossPay - totalDeductions;

    // ── 8. Employer contributions ─────────────────────────────────────────────
    // PRESTACION / APRENDIZAJE → no employer social-security contributions
    let employerHealthContribution = 0;
    let employerPensionContribution = 0;
    let employerArlContribution = 0;
    let employerSenaContribution = 0;
    let employerIcbfContribution = 0;
    let employerCajaContribution = 0;

    if (!isExempt) {
      employerHealthContribution = roundCOP(contributionBase * EMPLOYER_HEALTH_PCT);
      employerPensionContribution = roundCOP(contributionBase * EMPLOYER_PENSION_PCT);
      employerArlContribution = roundCOP(contributionBase * ARL_RATES[employee.arlRiskLevel]);
      employerSenaContribution = roundCOP(contributionBase * EMPLOYER_SENA_PCT);
      employerIcbfContribution = roundCOP(contributionBase * EMPLOYER_ICBF_PCT);
      employerCajaContribution = roundCOP(contributionBase * EMPLOYER_CAJA_PCT);
    }

    const totalEmployerContributions =
      employerHealthContribution +
      employerPensionContribution +
      employerArlContribution +
      employerSenaContribution +
      employerIcbfContribution +
      employerCajaContribution;

    // ── 9. Total payroll cost ─────────────────────────────────────────────────
    const totalPayrollCost = grossPay + totalEmployerContributions;

    return {
      employeeId: employee.employeeId,
      userId: employee.userId,
      tenantId: employee.tenantId,
      locationId: employee.locationId,
      period: attendance.period,
      contractType: employee.contractType,
      salaryType: employee.salaryType,
      salaryAmount: employee.salaryAmount,
      workedDays,
      calendarDays,
      salaryBase,
      transportSubsidy,
      overtimePay,
      overtimeBreakdown,
      grossPay,
      healthDeduction,
      pensionDeduction,
      incomeTaxWithholding,
      totalDeductions,
      netPay,
      employerHealthContribution,
      employerPensionContribution,
      employerArlContribution,
      employerSenaContribution,
      employerIcbfContribution,
      employerCajaContribution,
      totalEmployerContributions,
      totalPayrollCost,
    };
  }
}
