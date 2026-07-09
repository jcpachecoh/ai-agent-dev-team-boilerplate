import { Test, TestingModule } from '@nestjs/testing';
import { ArlRiskLevel, EmployeeContractType, SalaryType } from '@prisma/client';
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
  SMLV_2025,
  TRANSPORT_SUBSIDY_2025,
  TRANSPORT_SUBSIDY_THRESHOLD,
} from '../payroll.constants';
import { PayrollCalculationService } from '../service/payroll-calculation.service';
import {
  AttendanceMonthSummary,
  EmployeePayrollInput,
  OvertimeMinutesEntry,
  PayrollLegalRates,
} from '../interfaces/payroll-report.interfaces';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const PERIOD = { year: 2025, month: 6 }; // June 2025 — 30 calendar days

// CST art. 168 overtime surcharges — stable historically, versioned via NOM-06 since OS-586.
const RECARGO_HORA_EXTRA_DIURNA = 0.25;
const RECARGO_HORA_EXTRA_NOCTURNA = 0.75;
const RECARGO_DOMINICAL_FESTIVO = 0.75;

// JORNADA_MAX_SEMANAL(date) × 5 — see OvertimeMinutesEntry.monthlyHoursBase. 48h/semana × 5 = 240,
// matching the pre-OS-586 hardcoded MONTHLY_HOURS_BASE so existing assertions keep passing unchanged.
const TEST_MONTHLY_HOURS_BASE = 240;

// Reproduces the pre-OS-585 hardcoded constants (SMLV_2025, TRANSPORT_SUBSIDY_2025) as resolved
// LaborLegalParametersService values, so existing assertions keep passing unchanged. Overtime
// surcharges/divisor are no longer period-flat — see makeOvertimeEntry below (OS-586).
const LEGAL_RATES: PayrollLegalRates = {
  smlv: SMLV_2025,
  transportSubsidyThreshold: TRANSPORT_SUBSIDY_THRESHOLD,
  transportSubsidy: TRANSPORT_SUBSIDY_2025,
};

function makeOvertimeEntry(
  type: AttendanceOvertimeType,
  minutes: number,
  surchargeRate: number,
  monthlyHoursBase: number = TEST_MONTHLY_HOURS_BASE,
): OvertimeMinutesEntry {
  return { type, minutes, monthlyHoursBase, surchargeRate };
}

function makeEmployee(overrides: Partial<EmployeePayrollInput> = {}): EmployeePayrollInput {
  return {
    employeeId: 'emp-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    contractType: EmployeeContractType.INDEFINIDO,
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: SMLV_2025, // 1,423,500 COP
    hasTransportSubsidy: true,
    arlRiskLevel: ArlRiskLevel.RIESGO_I,
    ...overrides,
  };
}

function makeAttendance(overrides: Partial<AttendanceMonthSummary> = {}): AttendanceMonthSummary {
  return {
    employeeId: 'emp-1',
    period: PERIOD,
    presentDays: 30,
    absentDays: 0,
    totalWorkedMinutes: 30 * 480, // 30 days × 8h
    regularMinutes: 30 * 480,
    overtimeMinutes: 0,
    overtimeEntries: [],
    ...overrides,
  };
}

function roundCOP(v: number) {
  return Math.round(v);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PayrollCalculationService', () => {
  let service: PayrollCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollCalculationService],
    }).compile();

    service = module.get<PayrollCalculationService>(PayrollCalculationService);
    jest.clearAllMocks();
  });

  // ── 1. Salary base proration ────────────────────────────────────────────────

  describe('salaryBase proration', () => {
    it('full month (30/30) → salaryBase equals full salary', () => {
      const result = service.calculateEmployeePeriod(makeEmployee(), makeAttendance(), LEGAL_RATES);
      expect(result.salaryBase).toBe(SMLV_2025);
    });

    it('partial month (15/30) → salaryBase is half salary', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 2_000_000 }),
        makeAttendance({ presentDays: 15 }),
        LEGAL_RATES,
      );
      expect(result.salaryBase).toBe(roundCOP(2_000_000 * (15 / 30)));
      expect(result.workedDays).toBe(15);
      expect(result.calendarDays).toBe(30);
    });

    it('zero worked days → salaryBase is 0', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee(),
        makeAttendance({ presentDays: 0 }),
        LEGAL_RATES,
      );
      expect(result.salaryBase).toBe(0);
    });

    it('31-day month uses correct calendar days (January)', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 3_100_000 }),
        makeAttendance({ presentDays: 31, period: { year: 2025, month: 1 } }),
        LEGAL_RATES,
      );
      expect(result.calendarDays).toBe(31);
      expect(result.salaryBase).toBe(3_100_000); // 31/31 = full
    });

    it('February 2025 uses 28 calendar days', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 2_800_000 }),
        makeAttendance({ presentDays: 28, period: { year: 2025, month: 2 } }),
        LEGAL_RATES,
      );
      expect(result.calendarDays).toBe(28);
      expect(result.salaryBase).toBe(2_800_000);
    });
  });

  // ── 2. Transport subsidy ────────────────────────────────────────────────────

  describe('transportSubsidy', () => {
    it('eligible employee full month → gets full subsidy', () => {
      const result = service.calculateEmployeePeriod(makeEmployee(), makeAttendance(), LEGAL_RATES);
      expect(result.transportSubsidy).toBe(TRANSPORT_SUBSIDY_2025);
    });

    it('eligible employee partial month (15/30) → prorated subsidy', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee(),
        makeAttendance({ presentDays: 15 }),
        LEGAL_RATES,
      );
      expect(result.transportSubsidy).toBe(roundCOP(TRANSPORT_SUBSIDY_2025 * (15 / 30)));
    });

    it('INTEGRAL salary → no subsidy regardless of flag', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryType: SalaryType.INTEGRAL, hasTransportSubsidy: true }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.transportSubsidy).toBe(0);
    });

    it('hasTransportSubsidy false → no subsidy', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ hasTransportSubsidy: false }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.transportSubsidy).toBe(0);
    });

    it('salary above 2 SMLV threshold → no subsidy despite flag', () => {
      const highSalary = SMLV_2025 * 2 + 1;
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: highSalary, hasTransportSubsidy: true }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.transportSubsidy).toBe(0);
    });
  });

  // ── 3. Overtime pay ─────────────────────────────────────────────────────────

  describe('overtimePay', () => {
    it('no overtime → overtimePay is 0 and breakdown is empty', () => {
      const result = service.calculateEmployeePeriod(makeEmployee(), makeAttendance(), LEGAL_RATES);
      expect(result.overtimePay).toBe(0);
      expect(result.overtimeBreakdown).toHaveLength(0);
    });

    it('REGULAR type → no extra pay (surcharge 0)', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee(),
        makeAttendance({
          overtimeEntries: [makeOvertimeEntry(AttendanceOvertimeType.REGULAR, 240, 0)],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimePay).toBe(0);
      expect(result.overtimeBreakdown).toHaveLength(0);
    });

    it('DIURNO overtime 2h → pays 25% surcharge', () => {
      const salary = 3_000_000;
      const hours = 2;
      const hourlyRate = salary / TEST_MONTHLY_HOURS_BASE;
      const expected = roundCOP(hourlyRate * (1 + RECARGO_HORA_EXTRA_DIURNA) * hours);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(AttendanceOvertimeType.DIURNO, hours * 60, RECARGO_HORA_EXTRA_DIURNA),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimePay).toBe(expected);
      expect(result.overtimeBreakdown).toHaveLength(1);
      expect(result.overtimeBreakdown[0].surchargeRate).toBe(0.25);
    });

    it('NOCTURNO overtime 1h → pays 75% surcharge', () => {
      const salary = 3_000_000;
      const hours = 1;
      const hourlyRate = salary / TEST_MONTHLY_HOURS_BASE;
      const expected = roundCOP(hourlyRate * (1 + RECARGO_HORA_EXTRA_NOCTURNA) * hours);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(
              AttendanceOvertimeType.NOCTURNO,
              hours * 60,
              RECARGO_HORA_EXTRA_NOCTURNA,
            ),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimePay).toBe(expected);
      expect(result.overtimeBreakdown[0].surchargeRate).toBe(0.75);
    });

    it('FESTIVO_DIURNO 2h → pays 75% surcharge', () => {
      const salary = 3_000_000;
      const hours = 2;
      const hourlyRate = salary / TEST_MONTHLY_HOURS_BASE;
      const expected = roundCOP(hourlyRate * (1 + RECARGO_DOMINICAL_FESTIVO) * hours);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(
              AttendanceOvertimeType.FESTIVO_DIURNO,
              hours * 60,
              RECARGO_DOMINICAL_FESTIVO,
            ),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimePay).toBe(expected);
    });

    it('FESTIVO_NOCTURNO 1h → pays 150% surcharge (CST art. 168+179, corrected in Task04A)', () => {
      const salary = 3_000_000;
      const hours = 1;
      const hourlyRate = salary / TEST_MONTHLY_HOURS_BASE;
      // Corrected from 1.10 → 1.50 in Task04A: CST art. 168 (nocturno 75%) + art. 179 (festivo 75%)
      // Source: Concepto MinTrabajo 171671/2021
      const expected = roundCOP(hourlyRate * (1 + 1.5) * hours);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(AttendanceOvertimeType.FESTIVO_NOCTURNO, hours * 60, 1.5),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimePay).toBe(expected);
      expect(result.overtimeBreakdown[0].surchargeRate).toBe(1.5);
    });

    it('multiple overtime types → breakdown has one item per type and sum is correct', () => {
      const salary = 4_000_000;
      const hourlyRate = salary / TEST_MONTHLY_HOURS_BASE;
      const diurnoHours = 3;
      const nocturnoHours = 2;
      const expectedDiurno = roundCOP(hourlyRate * (1 + 0.25) * diurnoHours);
      const expectedNocturno = roundCOP(hourlyRate * (1 + 0.75) * nocturnoHours);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(AttendanceOvertimeType.DIURNO, diurnoHours * 60, 0.25),
            makeOvertimeEntry(AttendanceOvertimeType.NOCTURNO, nocturnoHours * 60, 0.75),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimeBreakdown).toHaveLength(2);
      expect(result.overtimePay).toBe(expectedDiurno + expectedNocturno);
    });

    it('two vigencias of the same type in one period → two separate breakdown rows (OS-586)', (): void => {
      // e.g. a payroll period straddling a JORNADA_MAX_SEMANAL cutover (July 15): the same
      // DIURNO type carries a different monthlyHoursBase before/after the cutover date.
      const salary = 4_000_000;
      const beforeCutoverHourlyRate = salary / 220; // 44h/semana × 5
      const afterCutoverHourlyRate = salary / 210; // 42h/semana × 5
      const expectedBefore = roundCOP(beforeCutoverHourlyRate * (1 + 0.25) * 2);
      const expectedAfter = roundCOP(afterCutoverHourlyRate * (1 + 0.25) * 2);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(AttendanceOvertimeType.DIURNO, 120, 0.25, 220),
            makeOvertimeEntry(AttendanceOvertimeType.DIURNO, 120, 0.25, 210),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimeBreakdown).toHaveLength(2);
      expect(result.overtimePay).toBe(expectedBefore + expectedAfter);
    });

    it('overtime hourly rate uses full salary, not prorated salary', () => {
      const salary = 3_000_000;
      const hours = 2;
      const expectedHourlyRate = salary / TEST_MONTHLY_HOURS_BASE; // uses full salary

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          presentDays: 15, // partial month
          overtimeEntries: [
            makeOvertimeEntry(AttendanceOvertimeType.DIURNO, hours * 60, RECARGO_HORA_EXTRA_DIURNA),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.overtimeBreakdown[0].hourlyRate).toBeCloseTo(expectedHourlyRate, 2);
    });
  });

  // ── 4. Gross pay ────────────────────────────────────────────────────────────

  describe('grossPay', () => {
    it('grossPay = salaryBase + transportSubsidy + overtimePay', () => {
      const salary = 2_000_000;
      const hours = 4;
      const hourlyRate = salary / TEST_MONTHLY_HOURS_BASE;
      const overtime = roundCOP(hourlyRate * (1 + 0.25) * hours);

      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary }),
        makeAttendance({
          overtimeEntries: [
            makeOvertimeEntry(AttendanceOvertimeType.DIURNO, hours * 60, RECARGO_HORA_EXTRA_DIURNA),
          ],
        }),
        LEGAL_RATES,
      );
      expect(result.grossPay).toBe(result.salaryBase + result.transportSubsidy + overtime);
    });
  });

  // ── 5. Employee deductions ──────────────────────────────────────────────────

  describe('employee deductions', () => {
    it('ORDINARIO: health and pension each 4% of contributionBase', () => {
      const salary = 4_000_000;
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, hasTransportSubsidy: false }),
        makeAttendance(),
        LEGAL_RATES,
      );
      const base = salary; // full month, ORDINARIO
      expect(result.healthDeduction).toBe(roundCOP(base * EMPLOYEE_HEALTH_PCT));
      expect(result.pensionDeduction).toBe(roundCOP(base * EMPLOYEE_PENSION_PCT));
    });

    it('INTEGRAL: deductions based on 70% of salaryBase', () => {
      const salary = 15_000_000;
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, salaryType: SalaryType.INTEGRAL }),
        makeAttendance(),
        LEGAL_RATES,
      );
      const base = roundCOP(salary * INTEGRAL_CONTRIBUTIONS_BASE_PCT);
      expect(result.healthDeduction).toBe(roundCOP(base * EMPLOYEE_HEALTH_PCT));
      expect(result.pensionDeduction).toBe(roundCOP(base * EMPLOYEE_PENSION_PCT));
    });

    it('incomeTaxWithholding is always 0 (GAP Task04)', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 20_000_000 }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.incomeTaxWithholding).toBe(0);
    });

    it('totalDeductions = healthDeduction + pensionDeduction + incomeTaxWithholding', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 5_000_000 }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.totalDeductions).toBe(
        result.healthDeduction + result.pensionDeduction + result.incomeTaxWithholding,
      );
    });

    it('partial month: deductions use prorated contributionBase, not full salary', () => {
      const salary = 4_000_000;
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, hasTransportSubsidy: false }),
        makeAttendance({ presentDays: 15 }),
        LEGAL_RATES,
      );
      const proratedBase = roundCOP(salary * (15 / 30));
      expect(result.healthDeduction).toBe(roundCOP(proratedBase * EMPLOYEE_HEALTH_PCT));
    });
  });

  // ── 6. Net pay ──────────────────────────────────────────────────────────────

  describe('netPay', () => {
    it('netPay = grossPay - totalDeductions', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 3_500_000 }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.netPay).toBe(result.grossPay - result.totalDeductions);
    });
  });

  // ── 7. Employer contributions ───────────────────────────────────────────────

  describe('employer contributions — ORDINARIO INDEFINIDO', () => {
    it('INDEFINIDO: all six contributions are non-zero', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 4_000_000, hasTransportSubsidy: false }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.employerHealthContribution).toBeGreaterThan(0);
      expect(result.employerPensionContribution).toBeGreaterThan(0);
      expect(result.employerArlContribution).toBeGreaterThan(0);
      expect(result.employerSenaContribution).toBeGreaterThan(0);
      expect(result.employerIcbfContribution).toBeGreaterThan(0);
      expect(result.employerCajaContribution).toBeGreaterThan(0);
    });

    it('employer contributions match expected percentages', () => {
      const salary = 4_000_000;
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, hasTransportSubsidy: false }),
        makeAttendance(),
        LEGAL_RATES,
      );
      const base = salary;
      expect(result.employerHealthContribution).toBe(roundCOP(base * EMPLOYER_HEALTH_PCT));
      expect(result.employerPensionContribution).toBe(roundCOP(base * EMPLOYER_PENSION_PCT));
      expect(result.employerArlContribution).toBe(
        roundCOP(base * ARL_RATES[ArlRiskLevel.RIESGO_I]),
      );
      expect(result.employerSenaContribution).toBe(roundCOP(base * EMPLOYER_SENA_PCT));
      expect(result.employerIcbfContribution).toBe(roundCOP(base * EMPLOYER_ICBF_PCT));
      expect(result.employerCajaContribution).toBe(roundCOP(base * EMPLOYER_CAJA_PCT));
    });

    it('RIESGO_V has higher ARL contribution than RIESGO_I', () => {
      const salary = 4_000_000;
      const riesgoI = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, arlRiskLevel: ArlRiskLevel.RIESGO_I }),
        makeAttendance(),
        LEGAL_RATES,
      );
      const riesgoV = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, arlRiskLevel: ArlRiskLevel.RIESGO_V }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(riesgoV.employerArlContribution).toBeGreaterThan(riesgoI.employerArlContribution);
    });

    it('totalEmployerContributions = sum of all six contributions', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 5_000_000 }),
        makeAttendance(),
        LEGAL_RATES,
      );
      const sum =
        result.employerHealthContribution +
        result.employerPensionContribution +
        result.employerArlContribution +
        result.employerSenaContribution +
        result.employerIcbfContribution +
        result.employerCajaContribution;
      expect(result.totalEmployerContributions).toBe(sum);
    });
  });

  // ── 8. INTEGRAL salary ──────────────────────────────────────────────────────

  describe('INTEGRAL salary', () => {
    it('employer contributions use 70% of salaryBase', () => {
      const salary = 15_000_000;
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: salary, salaryType: SalaryType.INTEGRAL }),
        makeAttendance(),
        LEGAL_RATES,
      );
      const base70 = roundCOP(salary * INTEGRAL_CONTRIBUTIONS_BASE_PCT);
      expect(result.employerHealthContribution).toBe(roundCOP(base70 * EMPLOYER_HEALTH_PCT));
      expect(result.employerPensionContribution).toBe(roundCOP(base70 * EMPLOYER_PENSION_PCT));
    });

    it('INTEGRAL employee has no transport subsidy', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryType: SalaryType.INTEGRAL, hasTransportSubsidy: true }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.transportSubsidy).toBe(0);
    });
  });

  // ── 9. Exempt contract types ────────────────────────────────────────────────

  describe('PRESTACION and APRENDIZAJE contracts', () => {
    it('PRESTACION → totalEmployerContributions is 0', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ contractType: EmployeeContractType.PRESTACION }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.totalEmployerContributions).toBe(0);
      expect(result.employerHealthContribution).toBe(0);
      expect(result.employerPensionContribution).toBe(0);
      expect(result.employerArlContribution).toBe(0);
      expect(result.employerSenaContribution).toBe(0);
      expect(result.employerIcbfContribution).toBe(0);
      expect(result.employerCajaContribution).toBe(0);
    });

    it('APRENDIZAJE → totalEmployerContributions is 0', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ contractType: EmployeeContractType.APRENDIZAJE }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.totalEmployerContributions).toBe(0);
    });

    it('FIJO → has normal employer contributions', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ contractType: EmployeeContractType.FIJO, salaryAmount: 3_000_000 }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.totalEmployerContributions).toBeGreaterThan(0);
    });
  });

  // ── 10. Total payroll cost ──────────────────────────────────────────────────

  describe('totalPayrollCost', () => {
    it('totalPayrollCost = grossPay + totalEmployerContributions', () => {
      const result = service.calculateEmployeePeriod(
        makeEmployee({ salaryAmount: 4_000_000 }),
        makeAttendance(),
        LEGAL_RATES,
      );
      expect(result.totalPayrollCost).toBe(result.grossPay + result.totalEmployerContributions);
    });
  });

  // ── 11. Output shape ────────────────────────────────────────────────────────

  describe('output shape', () => {
    it('output contains correct identity fields from input', () => {
      const emp = makeEmployee({
        employeeId: 'emp-abc',
        userId: 'user-abc',
        tenantId: 'tenant-xyz',
        locationId: 'loc-99',
      });
      const result = service.calculateEmployeePeriod(emp, makeAttendance(), LEGAL_RATES);
      expect(result.employeeId).toBe('emp-abc');
      expect(result.userId).toBe('user-abc');
      expect(result.tenantId).toBe('tenant-xyz');
      expect(result.locationId).toBe('loc-99');
      expect(result.period).toEqual(PERIOD);
      expect(result.contractType).toBe(EmployeeContractType.INDEFINIDO);
      expect(result.salaryType).toBe(SalaryType.ORDINARIO);
    });
  });

  // ── 12. End-to-end scenario: SMLV employee full month ─────────────────────

  describe('end-to-end: SMLV employee full month June 2025', () => {
    it('produces correct net pay and employer cost for minimum wage worker', () => {
      const salary = SMLV_2025; // 1,423,500
      const result = service.calculateEmployeePeriod(makeEmployee(), makeAttendance(), LEGAL_RATES);

      const base = salary;
      const subsidy = TRANSPORT_SUBSIDY_2025;
      const grossPay = base + subsidy;
      const health = roundCOP(base * EMPLOYEE_HEALTH_PCT);
      const pension = roundCOP(base * EMPLOYEE_PENSION_PCT);
      const netPay = grossPay - health - pension;

      const empHealth = roundCOP(base * EMPLOYER_HEALTH_PCT);
      const empPension = roundCOP(base * EMPLOYER_PENSION_PCT);
      const empArl = roundCOP(base * ARL_RATES[ArlRiskLevel.RIESGO_I]);
      const empSena = roundCOP(base * EMPLOYER_SENA_PCT);
      const empIcbf = roundCOP(base * EMPLOYER_ICBF_PCT);
      const empCaja = roundCOP(base * EMPLOYER_CAJA_PCT);
      const totalEmployer = empHealth + empPension + empArl + empSena + empIcbf + empCaja;

      expect(result.salaryBase).toBe(salary);
      expect(result.transportSubsidy).toBe(subsidy);
      expect(result.grossPay).toBe(grossPay);
      expect(result.netPay).toBe(netPay);
      expect(result.totalEmployerContributions).toBe(totalEmployer);
      expect(result.totalPayrollCost).toBe(grossPay + totalEmployer);
    });
  });
});
