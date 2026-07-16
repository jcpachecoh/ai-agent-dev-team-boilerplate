import { ArlRiskLevel, EmployeeContractType, SalaryType } from '@prisma/client';

import { PilaErrorCode } from '../pila/pila-error-codes';
import type {
  PilaEmployeeEnrichment,
  PilaEmployeeEventFlags,
  PilaOs380EmployeeSlice,
} from '../pila/pila-preparation.interfaces';
import {
  validateEmployeeForPila,
  validatePilaPeriodFormat,
  validateTenantForPila,
} from '../pila/pila-validation';
import type { TenantPilaConfigRecord } from '../interfaces/tenant-pila-config.interfaces';

const baseConfig = (overrides: Partial<TenantPilaConfigRecord> = {}): TenantPilaConfigRecord => ({
  id: 'cfg-1',
  tenantId: 'tenant-1',
  documentType: 'NI',
  claseAportante: 'B',
  naturalezaJuridica: '2',
  formaPresentacion: 'U',
  tipoAportante: '01',
  arlCode: '14-11',
  actividadEconomicaArl: '5611001',
  exemptFromHealthSenaIcbfLey1607: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const cleanEvents = (employeeId = 'emp-1'): PilaEmployeeEventFlags => ({
  employeeId,
  hasMedicalLeaveInPeriod: false,
  hasVacationInPeriod: false,
  hasPayrollNovedadInPeriod: false,
  hasIngressInPeriod: false,
  hasRetirementInPeriod: false,
});

const cleanEnrichment = (
  overrides: Partial<PilaEmployeeEnrichment> = {},
): PilaEmployeeEnrichment => ({
  employeeId: 'emp-1',
  employeeName: 'Ana Pérez',
  documentType: 'CC',
  documentNumber: '123',
  firstName: 'Ana',
  firstLastName: 'Pérez',
  secondLastName: null,
  hireDate: new Date('2024-01-15T00:00:00.000Z'),
  contractStart: new Date('2024-01-15T00:00:00.000Z'),
  contractEnd: null,
  epsName: 'EPS Sura',
  pensionFundName: 'Porvenir',
  arlName: 'ARL Sura',
  cajaCompensacion: 'Compensar',
  arlRiskLevel: ArlRiskLevel.RIESGO_I,
  departmentCode: '11',
  municipalityCode: '001',
  locationCode: 'PL-01',
  locationCityName: null,
  epsPilaCode: 'EPS010',
  afpPilaCode: '230301',
  arlPilaCode: '14-11',
  ccfPilaCode: 'CCF24',
  ...overrides,
});

const cleanSlice = (overrides: Partial<PilaOs380EmployeeSlice> = {}): PilaOs380EmployeeSlice => ({
  employeeId: 'emp-1',
  employeeName: 'Ana Pérez',
  contractType: EmployeeContractType.INDEFINIDO,
  salaryType: SalaryType.ORDINARIO,
  salaryAmount: 1_500_000,
  salaryBase: 1_500_000,
  contributionBase: 1_500_000,
  workedDays: 30,
  healthDeduction: 60_000,
  pensionDeduction: 60_000,
  employerHealthContribution: 127_500,
  employerPensionContribution: 180_000,
  employerArlContribution: 7_830,
  employerSenaContribution: 30_000,
  employerIcbfContribution: 45_000,
  employerCajaContribution: 60_000,
  totalEmployerContributions: 450_330,
  totalPayrollCost: 2_070_330,
  medicalLeaveOrdinaryDaysExcluded: 0,
  medicalLeaveEpsArlDays: 0,
  ...overrides,
});

describe('pila-validation', () => {
  it('rechaza período con formato inválido', () => {
    expect(validatePilaPeriodFormat('2026-13')?.code).toBe(PilaErrorCode.PERIOD_INVALID);
    expect(validatePilaPeriodFormat('2026-07')).toBeNull();
  });

  it('falla si falta TenantPilaConfig', () => {
    const errors = validateTenantForPila({
      nit: '900000000',
      verificationDigit: '5',
      pilaConfig: null,
      arlCatalogHasCode: false,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.TENANT_PILA_CONFIG_MISSING)).toBe(true);
  });

  it('falla si NIT/DV son inválidos o incoherentes', () => {
    const errors = validateTenantForPila({
      nit: '900000000',
      verificationDigit: '1',
      pilaConfig: baseConfig(),
      arlCatalogHasCode: true,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.TENANT_NIT_DV_INVALID)).toBe(true);
  });

  it('falla si ARL config no está en catálogo', () => {
    const errors = validateTenantForPila({
      nit: '900000000',
      verificationDigit: '5',
      pilaConfig: baseConfig(),
      arlCatalogHasCode: false,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.TENANT_ARL_CODE_NOT_IN_CATALOG)).toBe(true);
  });

  it('falla si tenant está exonerado Ley 1607', () => {
    const errors = validateTenantForPila({
      nit: '900000000',
      verificationDigit: '5',
      pilaConfig: baseConfig({ exemptFromHealthSenaIcbfLey1607: true }),
      arlCatalogHasCode: true,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.TENANT_EXEMPT_LEY_1607)).toBe(true);
  });

  it('falla por contrato no soportado', () => {
    const errors = validateEmployeeForPila({
      slice: cleanSlice({ contractType: EmployeeContractType.PRESTACION }),
      enrichment: cleanEnrichment(),
      events: cleanEvents(),
      smlv: 1_423_500,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_UNSUPPORTED_CONTRACT)).toBe(true);
  });

  it('falla por documento no soportado', () => {
    const errors = validateEmployeeForPila({
      slice: cleanSlice(),
      enrichment: cleanEnrichment({ documentType: 'PEP' }),
      events: cleanEvents(),
      smlv: 1_423_500,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_UNSUPPORTED_DOCUMENT)).toBe(true);
  });

  it('falla por código PILA de EPS faltante', () => {
    const errors = validateEmployeeForPila({
      slice: cleanSlice(),
      enrichment: cleanEnrichment({ epsPilaCode: null }),
      events: cleanEvents(),
      smlv: 1_423_500,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_EPS_PILA_CODE_MISSING)).toBe(true);
  });

  it('falla por novedad PILA no soportada', () => {
    const errors = validateEmployeeForPila({
      slice: cleanSlice(),
      enrichment: cleanEnrichment(),
      events: { ...cleanEvents(), hasVacationInPeriod: true },
      smlv: 1_423_500,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_HAS_UNSUPPORTED_PILA_EVENT)).toBe(
      true,
    );
  });

  it('FSP: por debajo de 4 SMMLV no bloquea', () => {
    const smlv = 1_000_000;
    const errors = validateEmployeeForPila({
      slice: cleanSlice({ contributionBase: 4 * smlv - 1 }),
      enrichment: cleanEnrichment(),
      events: cleanEvents(),
      smlv,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_REQUIRES_FSP)).toBe(false);
  });

  it('FSP: exactamente 4 SMMLV bloquea (>=)', () => {
    const smlv = 1_000_000;
    const errors = validateEmployeeForPila({
      slice: cleanSlice({ contributionBase: 4 * smlv }),
      enrichment: cleanEnrichment(),
      events: cleanEvents(),
      smlv,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_REQUIRES_FSP)).toBe(true);
  });

  it('FSP: por encima de 4 SMMLV bloquea', () => {
    const smlv = 1_000_000;
    const errors = validateEmployeeForPila({
      slice: cleanSlice({ contributionBase: 4 * smlv + 1 }),
      enrichment: cleanEnrichment(),
      events: cleanEvents(),
      smlv,
    });
    expect(errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_REQUIRES_FSP)).toBe(true);
  });

  it('acumula múltiples errores en el mismo empleado', () => {
    const errors = validateEmployeeForPila({
      slice: cleanSlice({ contractType: EmployeeContractType.APRENDIZAJE }),
      enrichment: cleanEnrichment({
        documentType: 'PEP',
        epsPilaCode: null,
        departmentCode: null,
      }),
      events: { ...cleanEvents(), hasMedicalLeaveInPeriod: true },
      smlv: 1_000_000,
    });
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(new Set(errors.map((e) => e.code)).size).toBeGreaterThanOrEqual(4);
  });

  it('caso feliz empleado línea limpia sin errores', () => {
    const errors = validateEmployeeForPila({
      slice: cleanSlice(),
      enrichment: cleanEnrichment(),
      events: cleanEvents(),
      smlv: 1_423_500,
    });
    expect(errors).toEqual([]);
  });
});
