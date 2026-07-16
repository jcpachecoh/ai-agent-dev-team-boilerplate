import { Test, TestingModule } from '@nestjs/testing';
import {
  ArlRiskLevel,
  EmployeeCatalogType,
  EmployeeContractType,
  SalaryType,
} from '@prisma/client';

import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { MedicalLeavesRepository } from '../../medical-leaves/repository/medical-leaves.repository';
import { PayrollNovedadesRepository } from '../../payroll-novedades/repository/payroll-novedades.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../../reports/service/reports.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import { PilaErrorCode } from '../pila/pila-error-codes';
import { PilaPreparationService } from '../pila/pila-preparation.service';
import { EmployeeCatalogService } from '../service/employee-catalog.service';
import { TenantPilaConfigService } from '../service/tenant-pila-config.service';

describe('PilaPreparationService', () => {
  let service: PilaPreparationService;
  let reportsService: { getPayrollReport: jest.Mock };
  let prisma: {
    tenant: { findFirst: jest.Mock };
    employeeDetails: { findMany: jest.Mock };
  };
  let tenantPilaConfigService: { findByTenantId: jest.Mock };
  let employeeCatalogService: { findAll: jest.Mock };
  let medicalLeavesRepository: { findOverlappingForPayrollPeriodByEmployeeIds: jest.Mock };
  let payrollNovedadesRepository: { findApprovedForPeriodByEmployeeIds: jest.Mock };
  let vacationsService: { getApprovedDisfruteRanges: jest.Mock };
  let legalParametersService: { getValueAt: jest.Mock };

  const tenantId = 'tenant-demo';
  const actor = { userId: 'u1', roleCode: 'OWNER' };

  const pilaConfig = {
    id: 'cfg-1',
    tenantId,
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
  };

  const payrollRow = {
    employeeId: 'emp-1',
    employeeName: 'Ana Pérez',
    cedula: '123',
    locationId: 'loc-1',
    locationName: 'Sede 1',
    contractType: EmployeeContractType.INDEFINIDO,
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: 1_500_000,
    workedDays: 30,
    calendarDays: 30,
    salaryBase: 1_500_000,
    contributionBase: 1_500_000,
    transportSubsidy: 0,
    overtimePay: 0,
    overtimeBreakdown: [],
    grossPay: 1_500_000,
    healthDeduction: 60_000,
    pensionDeduction: 60_000,
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
    totalDeductions: 120_000,
    netPay: 1_380_000,
    employerHealthContribution: 127_500,
    employerPensionContribution: 180_000,
    employerArlContribution: 7_830,
    employerSenaContribution: 30_000,
    employerIcbfContribution: 45_000,
    employerCajaContribution: 60_000,
    totalEmployerContributions: 450_330,
    totalPayrollCost: 1_950_330,
    medicalLeaveEmployerDays: 0,
    medicalLeaveEmployerPay: 0,
    medicalLeaveEpsArlDays: 0,
    medicalLeaveEpsArlPay: 0,
    medicalLeaveOrdinaryDaysExcluded: 0,
  };

  beforeEach(async () => {
    reportsService = {
      getPayrollReport: jest.fn().mockResolvedValue({
        tenantId,
        period: { year: 2026, month: 7 },
        employees: [payrollRow],
        tenantTotals: {
          employeeCount: 1,
          totalGrossPay: 1_500_000,
          totalDeductions: 120_000,
          totalNetPay: 1_380_000,
          totalEmployerContributions: 450_330,
          totalPayrollCost: 1_950_330,
        },
        locationTotals: [],
      }),
    };
    prisma = {
      tenant: {
        findFirst: jest.fn().mockResolvedValue({
          id: tenantId,
          name: 'Demo',
          legalName: 'Demo S.A.S.',
          nit: '900000000',
          verificationDigit: '5',
        }),
      },
      employeeDetails: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'emp-1',
            name: 'Ana Pérez',
            hireDate: new Date('2024-01-15T00:00:00.000Z'),
            contractStart: new Date('2024-01-15T00:00:00.000Z'),
            contractEnd: null,
            epsName: 'EPS Sura',
            pensionFundName: 'Porvenir',
            arlName: 'ARL Sura',
            cajaCompensacion: 'Compensar',
            arlRiskLevel: ArlRiskLevel.RIESGO_I,
            user: { cedula: '123', documentType: 'CC' },
            personalData: { nombres: 'Ana', primerApellido: 'Pérez', segundoApellido: null },
            location: { code: 'PL-01', departmentCode: '11', municipalityCode: '001' },
          },
        ]),
      },
    };
    tenantPilaConfigService = { findByTenantId: jest.fn().mockResolvedValue(pilaConfig) };
    employeeCatalogService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'c1',
          tenantId,
          type: EmployeeCatalogType.EPS,
          name: 'EPS Sura',
          pilaCode: 'EPS010',
          isActive: true,
        },
        {
          id: 'c2',
          tenantId,
          type: EmployeeCatalogType.PENSION_FUND,
          name: 'Porvenir',
          pilaCode: '230301',
          isActive: true,
        },
        {
          id: 'c3',
          tenantId,
          type: EmployeeCatalogType.ARL,
          name: 'ARL Sura',
          pilaCode: '14-11',
          isActive: true,
        },
        {
          id: 'c4',
          tenantId,
          type: EmployeeCatalogType.CAJA_COMPENSACION,
          name: 'Compensar',
          pilaCode: 'CCF24',
          isActive: true,
        },
      ]),
    };
    medicalLeavesRepository = {
      findOverlappingForPayrollPeriodByEmployeeIds: jest.fn().mockResolvedValue([]),
    };
    payrollNovedadesRepository = {
      findApprovedForPeriodByEmployeeIds: jest.fn().mockResolvedValue([]),
    };
    vacationsService = { getApprovedDisfruteRanges: jest.fn().mockResolvedValue([]) };
    legalParametersService = { getValueAt: jest.fn().mockResolvedValue(1_423_500) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilaPreparationService,
        { provide: ReportsService, useValue: reportsService },
        { provide: PrismaService, useValue: prisma },
        { provide: TenantPilaConfigService, useValue: tenantPilaConfigService },
        { provide: EmployeeCatalogService, useValue: employeeCatalogService },
        { provide: MedicalLeavesRepository, useValue: medicalLeavesRepository },
        { provide: PayrollNovedadesRepository, useValue: payrollNovedadesRepository },
        { provide: VacationsService, useValue: vacationsService },
        { provide: LaborLegalParametersService, useValue: legalParametersService },
      ],
    }).compile();

    service = module.get(PilaPreparationService);
  });

  it('caso feliz: produce draft planilla E / cotizante 01 / forma U', async () => {
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.aportante.tipoPlanilla).toBe('E');
    expect(result.data.aportante.formaPresentacion).toBe('U');
    expect(result.data.aportante.nit).toBe('900000000');
    expect(result.data.aportante.verificationDigit).toBe('5');
    expect(result.data.cotizantes).toHaveLength(1);
    expect(result.data.cotizantes[0].tipoCotizante).toBe('01');
    expect(result.data.cotizantes[0].epsCode).toBe('EPS010');
    expect(result.data.cotizantes[0].contributionBase).toBe(1_500_000);
  });

  it('usa exactamente el contributionBase entregado por OS-380 (sin recalcular INTEGRAL)', async () => {
    // Por debajo de 4 SMMLV para no disparar FSP; el punto es que PILA no aplique 70%.
    const os380ContributionBase = 2_100_000;
    reportsService.getPayrollReport.mockResolvedValue({
      tenantId,
      period: { year: 2026, month: 7 },
      employees: [
        {
          ...payrollRow,
          salaryType: SalaryType.INTEGRAL,
          salaryBase: 3_000_000,
          contributionBase: os380ContributionBase,
        },
      ],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 3_000_000,
        totalDeductions: 0,
        totalNetPay: 0,
        totalEmployerContributions: 0,
        totalPayrollCost: 0,
      },
      locationTotals: [],
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.cotizantes[0].contributionBase).toBe(os380ContributionBase);
    // No debe ser salaryBase ni salaryBase*0.7 recalculado en PILA de otro valor.
    expect(result.data.cotizantes[0].contributionBase).not.toBe(3_000_000);
  });

  it('falla si falta TenantPilaConfig', async () => {
    tenantPilaConfigService.findByTenantId.mockResolvedValue(null);
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.TENANT_PILA_CONFIG_MISSING)).toBe(
      true,
    );
  });

  it('falla si NIT/DV inválidos', async () => {
    prisma.tenant.findFirst.mockResolvedValue({
      id: tenantId,
      name: 'Demo',
      legalName: 'Demo S.A.S.',
      nit: '900000000',
      verificationDigit: '1',
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.TENANT_NIT_DV_INVALID)).toBe(true);
  });

  it('falla si falta código PILA de afiliación', async () => {
    employeeCatalogService.findAll.mockResolvedValue([
      {
        id: 'c3',
        tenantId,
        type: EmployeeCatalogType.ARL,
        name: 'ARL Sura',
        pilaCode: '14-11',
        isActive: true,
      },
    ]);
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_EPS_PILA_CODE_MISSING)).toBe(
      true,
    );
  });

  it('falla si ARL del tenant no está en catálogo', async () => {
    tenantPilaConfigService.findByTenantId.mockResolvedValue({
      ...pilaConfig,
      arlCode: '14-99',
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.TENANT_ARL_CODE_NOT_IN_CATALOG)).toBe(
      true,
    );
  });

  it('falla por contrato no soportado', async () => {
    reportsService.getPayrollReport.mockResolvedValue({
      tenantId,
      period: { year: 2026, month: 7 },
      employees: [{ ...payrollRow, contractType: EmployeeContractType.PRESTACION }],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        totalEmployerContributions: 0,
        totalPayrollCost: 0,
      },
      locationTotals: [],
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_UNSUPPORTED_CONTRACT)).toBe(
      true,
    );
  });

  it('falla por documento no soportado', async () => {
    prisma.employeeDetails.findMany.mockResolvedValue([
      {
        id: 'emp-1',
        name: 'Ana Pérez',
        hireDate: new Date('2024-01-15T00:00:00.000Z'),
        contractStart: new Date('2024-01-15T00:00:00.000Z'),
        contractEnd: null,
        epsName: 'EPS Sura',
        pensionFundName: 'Porvenir',
        arlName: 'ARL Sura',
        cajaCompensacion: 'Compensar',
        arlRiskLevel: ArlRiskLevel.RIESGO_I,
        user: { cedula: '123', documentType: 'PEP' },
        personalData: { nombres: 'Ana', primerApellido: 'Pérez', segundoApellido: null },
        location: { code: 'PL-01', departmentCode: '11', municipalityCode: '001' },
      },
    ]);
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_UNSUPPORTED_DOCUMENT)).toBe(
      true,
    );
  });

  it('falla por novedad no soportada', async () => {
    medicalLeavesRepository.findOverlappingForPayrollPeriodByEmployeeIds.mockResolvedValue([
      { employeeId: 'emp-1' },
    ]);
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_HAS_UNSUPPORTED_PILA_EVENT),
    ).toBe(true);
  });

  it('falla cuando IBC requiere FSP', async () => {
    legalParametersService.getValueAt.mockResolvedValue(1_000_000);
    reportsService.getPayrollReport.mockResolvedValue({
      tenantId,
      period: { year: 2026, month: 7 },
      employees: [{ ...payrollRow, salaryBase: 4_500_001, contributionBase: 4_000_000 }],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        totalEmployerContributions: 0,
        totalPayrollCost: 0,
      },
      locationTotals: [],
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.EMPLOYEE_REQUIRES_FSP)).toBe(true);
  });

  it('falla si tenant exonerado Ley 1607', async () => {
    tenantPilaConfigService.findByTenantId.mockResolvedValue({
      ...pilaConfig,
      exemptFromHealthSenaIcbfLey1607: true,
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === PilaErrorCode.TENANT_EXEMPT_LEY_1607)).toBe(true);
  });

  it('acumula múltiples errores sin emitir draft parcial', async () => {
    tenantPilaConfigService.findByTenantId.mockResolvedValue(null);
    prisma.tenant.findFirst.mockResolvedValue({
      id: tenantId,
      name: 'Demo',
      legalName: null,
      nit: null,
      verificationDigit: null,
    });
    const result = await service.preparePeriod(tenantId, '2026-07', actor);
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('aísla por tenantId en todas las consultas de datos', async () => {
    await service.preparePeriod('tenant-A', '2026-07', actor);
    expect(prisma.tenant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'tenant-A' }) }),
    );
    expect(tenantPilaConfigService.findByTenantId).toHaveBeenCalledWith('tenant-A');
    expect(employeeCatalogService.findAll).toHaveBeenCalledWith('tenant-A');
    expect(reportsService.getPayrollReport).toHaveBeenCalledWith(
      'tenant-A',
      { period: '2026-07' },
      actor,
    );
    expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      }),
    );
  });
});
