import { EmployeeContractType, SalaryType } from '@prisma/client';

import type { PilaCotizanteDraft, PilaPeriodDraft } from '../../pila-preparation.interfaces';
import {
  EMPLOYEE_HEALTH_PCT,
  EMPLOYEE_PENSION_PCT,
  EMPLOYER_CAJA_PCT,
  EMPLOYER_HEALTH_PCT,
  EMPLOYER_ICBF_PCT,
  EMPLOYER_PENSION_PCT,
  EMPLOYER_SENA_PCT,
} from '../../../payroll.constants';

/** Fixture controlado para golden files del serializador PILA. */
export function buildCleanPilaDraft(overrides?: {
  employeeCount?: number;
  legalName?: string;
}): PilaPeriodDraft {
  const employeeCount = Math.max(1, overrides?.employeeCount ?? 1);
  const baseCotizante = {
    documentType: 'CC',
    documentNumber: '1234567890',
    firstName: 'ANA',
    firstLastName: 'PEREZ',
    secondLastName: 'GOMEZ',
    tipoCotizante: '01' as const,
    afpCode: '230301',
    epsCode: 'EPS010',
    arlCode: '14-11',
    ccfCode: 'CCF24',
    departmentCode: '11',
    municipalityCode: '001',
    locationCityName: null,
    workedDays: 30,
    salaryAmount: 1_500_000,
    isIntegralSalary: false,
    contributionBase: 1_500_000,
    contributions: {
      employeeHealth: 60_000,
      employeePension: 60_000,
      employerHealth: 127_500,
      employerPension: 180_000,
      employerArl: 7_830,
      employerSena: 30_000,
      employerIcbf: 45_000,
      employerCaja: 60_000,
      employeeHealthPct: EMPLOYEE_HEALTH_PCT,
      employeePensionPct: EMPLOYEE_PENSION_PCT,
      employerHealthPct: EMPLOYER_HEALTH_PCT,
      employerPensionPct: EMPLOYER_PENSION_PCT,
      employerSenaPct: EMPLOYER_SENA_PCT,
      employerIcbfPct: EMPLOYER_ICBF_PCT,
      employerCajaPct: EMPLOYER_CAJA_PCT,
      employerArlPct: 0.00522,
    },
    arlRiskClass: '1',
    actividadEconomicaArl: '5611001',
    workCenterCode: '000000001',
    contractType: EmployeeContractType.INDEFINIDO,
    salaryType: SalaryType.ORDINARIO,
  };

  const cotizantes: PilaCotizanteDraft[] = [];
  for (let i = 0; i < employeeCount; i++) {
    if (i === 0) {
      cotizantes.push({ ...baseCotizante, employeeId: 'emp-1' });
      continue;
    }
    if (i === 1) {
      cotizantes.push({
        ...baseCotizante,
        employeeId: 'emp-2',
        documentNumber: '9876543210',
        firstName: 'LUIS',
        firstLastName: 'RAMOS',
        secondLastName: null,
        contributionBase: 2_000_000,
        salaryAmount: 2_000_000,
        contributions: {
          ...baseCotizante.contributions,
          employeeHealth: 80_000,
          employeePension: 80_000,
          employerHealth: 170_000,
          employerPension: 240_000,
          employerArl: 10_440,
          employerSena: 40_000,
          employerIcbf: 60_000,
          employerCaja: 80_000,
        },
      });
      continue;
    }
    cotizantes.push({
      ...baseCotizante,
      employeeId: `emp-${i + 1}`,
      documentNumber: String(1_100_000_000 + i),
      firstName: `EMP${i + 1}`,
      firstLastName: 'DEMO',
      secondLastName: null,
    });
  }

  const totalPayrollCost = cotizantes.reduce((sum, c) => sum + c.salaryAmount, 0);
  const totalEmployeeContributions = cotizantes.reduce(
    (sum, c) => sum + c.contributions.employeeHealth + c.contributions.employeePension,
    0,
  );
  const totalEmployerContributions = cotizantes.reduce(
    (sum, c) =>
      sum +
      c.contributions.employerHealth +
      c.contributions.employerPension +
      c.contributions.employerArl +
      c.contributions.employerSena +
      c.contributions.employerIcbf +
      c.contributions.employerCaja,
    0,
  );

  return {
    tenantId: 'tenant-demo',
    period: '2026-07',
    aportante: {
      legalName: overrides?.legalName ?? 'PALOS DE LENA SAS',
      documentType: 'NI',
      nit: '900000000',
      verificationDigit: '5',
      tipoPlanilla: 'E',
      formaPresentacion: 'U',
      tipoAportante: '01',
      claseAportante: 'B',
      naturalezaJuridica: '2',
      arlCode: '14-11',
      actividadEconomicaArl: '5611001',
      periodHealth: '2026-07',
      periodOther: '2026-06',
      exemptFromHealthSenaIcbfLey1607: false,
    },
    cotizantes,
    totals: {
      employeeCount: cotizantes.length,
      totalPayrollCost,
      totalEmployeeContributions,
      totalEmployerContributions,
    },
  };
}
