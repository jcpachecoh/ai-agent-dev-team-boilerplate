import { EmployeeContractType, SalaryType } from '@prisma/client';

import type { PayrollEmployeeRowDto } from '../../reports/controller/dto/payroll-report-response.dto';
import {
  collapseOs380RowsForPila,
  PILA_ROTANTE_PENDING_LOCATION_ID,
} from '../pila/pila-os380-collapse';

function baseRow(overrides: Partial<PayrollEmployeeRowDto>): PayrollEmployeeRowDto {
  return {
    employeeId: 'emp-rotante',
    employeeName: 'Laura Rotante',
    cedula: '1099887766',
    locationId: 'loc-a',
    locationName: 'Sede A',
    contractType: EmployeeContractType.INDEFINIDO,
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: 1_500_000,
    workedDays: 10,
    calendarDays: 30,
    salaryBase: 500_000,
    contributionBase: 1_500_000,
    transportSubsidy: 0,
    overtimePay: 0,
    overtimeBreakdown: [],
    grossPay: 500_000,
    healthDeduction: 20_000,
    pensionDeduction: 20_000,
    incomeTaxWithholding: 0,
    taxWithholdingBreakdown: {
      taxWithholdingBase: 0,
      uvtValue: 0,
      taxWithholdingBaseUvt: 0,
      bracketLowerUvtExclusive: null,
      bracketUpperUvtInclusive: null,
      marginalRate: null,
      fixedTaxUvt: null,
      incomeTaxWithholding: 0,
      isExemptFromTax: false,
    },
    totalDeductions: 40_000,
    netPay: 460_000,
    employerHealthContribution: 42_500,
    employerPensionContribution: 60_000,
    employerArlContribution: 2_610,
    employerSenaContribution: 10_000,
    employerIcbfContribution: 15_000,
    employerCajaContribution: 20_000,
    totalEmployerContributions: 150_110,
    totalPayrollCost: 650_110,
    medicalLeaveEmployerDays: 0,
    medicalLeaveEmployerPay: 0,
    medicalLeaveEpsArlDays: 0,
    medicalLeaveEpsArlPay: 0,
    medicalLeaveOrdinaryDaysExcluded: 0,
    ...overrides,
  };
}

describe('collapseOs380RowsForPila', () => {
  it('deja filas únicas intactas', () => {
    const row = baseRow({});
    expect(collapseOs380RowsForPila([row])).toEqual([row]);
  });

  it('colapsa ROTANTE: suma montos, conserva IBC y sede con más días', () => {
    const a = baseRow({
      locationId: 'loc-a',
      workedDays: 10,
      healthDeduction: 20_000,
      employerHealthContribution: 40_000,
    });
    const b = baseRow({
      locationId: 'loc-b',
      locationName: 'Sede B',
      workedDays: 20,
      salaryBase: 1_000_000,
      healthDeduction: 40_000,
      employerHealthContribution: 80_000,
      totalPayrollCost: 1_300_000,
    });

    const [merged] = collapseOs380RowsForPila([a, b]);
    expect(merged).toBeDefined();
    expect(merged!.employeeId).toBe('emp-rotante');
    expect(merged!.locationId).toBe('loc-b');
    expect(merged!.workedDays).toBe(30);
    expect(merged!.contributionBase).toBe(1_500_000);
    expect(merged!.healthDeduction).toBe(60_000);
    expect(merged!.employerHealthContribution).toBe(120_000);
    expect(merged!.totalPayrollCost).toBe(a.totalPayrollCost + b.totalPayrollCost);
  });

  it('prefiere sede real sobre bucket pendiente', () => {
    const pending = baseRow({
      locationId: PILA_ROTANTE_PENDING_LOCATION_ID,
      workedDays: 25,
    });
    const real = baseRow({
      locationId: 'loc-a',
      workedDays: 5,
    });
    const [merged] = collapseOs380RowsForPila([pending, real]);
    expect(merged!.locationId).toBe('loc-a');
  });
});
