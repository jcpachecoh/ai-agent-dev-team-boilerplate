import { Test, type TestingModule } from '@nestjs/testing';
import { EmployeeContractType, Prisma, SalaryType } from '@prisma/client';

import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import type { EmployeeCesantiasBalanceAsOf } from '../interfaces/cesantias-service.interfaces';
import type { EmploymentContractRecord } from '../interfaces/employee-contract.interfaces';
import type { PrimaBalanceAsOf } from '../interfaces/prima-service.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import { getPayrollConceptDefinition } from '../payroll-concepts.constants';
import { CesantiasService } from '../service/cesantias.service';
import { FinalSettlementAggregatorService } from '../service/final-settlement-aggregator.service';
import { IndemnificationCalculationService } from '../service/indemnification-calculation.service';
import { PendingSalaryService } from '../service/pending-salary.service';
import { PayrollConceptsService } from '../service/payroll-concepts.service';
import { PrimaService } from '../service/prima.service';
import { VariableAverageService } from '../service/variable-average.service';

const TENANT_ID = 'tenant-agg-001';
const EMPLOYEE_ID = 'emp-agg-001';
const TERMINATION_DATE = new Date('2024-06-30');

function mockContract(overrides: Partial<EmploymentContractRecord> = {}): EmploymentContractRecord {
  return {
    id: 'contract-001',
    tenantId: TENANT_ID,
    employeeDetailsId: EMPLOYEE_ID,
    contractType: EmployeeContractType.INDEFINIDO,
    startDate: new Date('2020-01-01'),
    agreedEndDate: null,
    status: 'ACTIVO',
    terminationDate: null,
    terminationReason: null,
    terminationNotes: null,
    activeSlot: true,
    changedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FinalSettlementAggregatorService', (): void => {
  let service: FinalSettlementAggregatorService;
  let legalParams: jest.Mocked<LaborLegalParametersService>;
  let contractRepo: jest.Mocked<EmployeeContractRepository>;
  let cesantiasService: jest.Mocked<CesantiasService>;
  let primaService: jest.Mocked<PrimaService>;
  let vacationsService: jest.Mocked<VacationsService>;
  let pendingSalaryService: jest.Mocked<PendingSalaryService>;
  let variableAverageService: jest.Mocked<VariableAverageService>;
  let payrollConcepts: jest.Mocked<PayrollConceptsService>;
  let prisma: jest.Mocked<PrismaService>;

  // Named mock functions — avoids unbound-method rule
  let mockGetValueAt: jest.Mock;
  let mockFindActiveContract: jest.Mock;
  let mockSalaryFindFirst: jest.Mock;
  let mockGetEmployeeBalance: jest.Mock;
  let mockGetPrimaBalance: jest.Mock;
  let mockCalculateVacBalance: jest.Mock;
  let mockPendingSalaryCalc: jest.Mock;
  let mockVariableAvgCalc: jest.Mock;
  let mockResolveEffective: jest.Mock;

  beforeEach(async (): Promise<void> => {
    mockGetValueAt = jest.fn().mockImplementation((key: string): Promise<number> => {
      const values: Record<string, number> = {
        SMLV: 1300000,
        AUXILIO_TRANSPORTE: 162000,
        INDEMNIZACION_FORMULA_VERSION: 1,
        INDEMNIZACION_UMBRAL_SMLV: 10,
      };
      return Promise.resolve(values[key] ?? 0);
    });

    mockFindActiveContract = jest.fn().mockResolvedValue(mockContract());

    mockSalaryFindFirst = jest.fn().mockResolvedValue({
      id: 'sal-001',
      salaryAmount: new Prisma.Decimal('2000000'),
      salaryType: SalaryType.ORDINARIO,
      effectiveFrom: new Date('2020-01-01'),
      effectiveTo: null,
    });

    const cesantiasBalance: EmployeeCesantiasBalanceAsOf = {
      pendingCesantias: '1000000.00',
      pendingInterest: '120000.00',
      calculationBase: '2000000.00',
      sourceLiquidations: [],
      statesConsidered: {
        pendingCesantiasStatuses: [],
        excludedCesantiasStatuses: [],
        pendingInterestStatuses: [],
        excludedInterestStatuses: [],
      },
      legalParametersSnapshot: {
        interestRate: '0.12',
        divisor: '360',
        transportSubsidyAmount: '162000',
        transportSubsidyThreshold: '2600000',
      },
      asOfDate: TERMINATION_DATE,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: TERMINATION_DATE,
    };
    mockGetEmployeeBalance = jest.fn().mockResolvedValue(cesantiasBalance);

    const primaBalance: PrimaBalanceAsOf = {
      pendingAmount: '800000.00',
      accruedAmount: '800000.00',
      paidAmount: '0.00',
      overpaymentAmount: '0.00',
      baseAmount: '2000000.00',
      sourceLiquidations: [],
      segments: [],
      divisorSnapshot: '180',
      asOfDate: TERMINATION_DATE,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: TERMINATION_DATE,
    };
    mockGetPrimaBalance = jest.fn().mockResolvedValue(primaBalance);

    mockCalculateVacBalance = jest.fn().mockResolvedValue({
      accruedDays: new Prisma.Decimal('30'),
      takenDays: new Prisma.Decimal('10'),
      compensatedDays: new Prisma.Decimal('0'),
      pendingDays: new Prisma.Decimal('20'),
    });

    mockPendingSalaryCalc = jest.fn().mockResolvedValue({
      periodStart: new Date('2024-06-01'),
      periodEnd: TERMINATION_DATE,
      calendarDays: 30,
      commercialDays: 30,
      monthlySalary: '2000000.00',
      dailySalary: '66666.67',
      basePendingSalary: '2000000.00',
      novedadDeductions: '0.00',
      pendingOvertimeAmount: '0.00',
      totalPendingSalary: '2000000.00',
      breakdown: [],
      sources: [],
      warnings: [],
    });

    mockVariableAvgCalc = jest.fn().mockResolvedValue({
      periodStart: new Date('2023-12-01').toISOString(),
      periodEnd: TERMINATION_DATE.toISOString(),
      monthsCovered: 6,
      daysCovered: 182,
      totalVariable: '0.00',
      monthlyAverage: '0.00',
      includedConcepts: [],
      payrollSources: [],
      unresolvable: false,
      warnings: [],
    });

    mockResolveEffective = jest.fn().mockImplementation(
      async (
        _tenantId: string,
        code: string,
      ): Promise<{
        id: string;
        code: string;
        displayName: string;
        lineNature: string;
        isTenantOverride: boolean;
        overrideId: null;
      }> => {
        const def = getPayrollConceptDefinition(code);
        if (!def) {
          throw new Error(`Unknown concept ${code}`);
        }
        return {
          id: `global-${code}`,
          code: def.code,
          displayName: def.displayName,
          lineNature: def.lineNature,
          isTenantOverride: false,
          overrideId: null,
        };
      },
    );

    legalParams = {
      getValueAt: mockGetValueAt,
    } as unknown as jest.Mocked<LaborLegalParametersService>;
    contractRepo = {
      findActiveContract: mockFindActiveContract,
      findById: jest.fn(),
    } as unknown as jest.Mocked<EmployeeContractRepository>;
    cesantiasService = {
      getEmployeeBalanceAsOf: mockGetEmployeeBalance,
    } as unknown as jest.Mocked<CesantiasService>;
    primaService = {
      getPrimaBalanceAsOf: mockGetPrimaBalance,
    } as unknown as jest.Mocked<PrimaService>;
    vacationsService = {
      calculateBalanceAsOf: mockCalculateVacBalance,
    } as unknown as jest.Mocked<VacationsService>;
    pendingSalaryService = {
      calculate: mockPendingSalaryCalc,
    } as unknown as jest.Mocked<PendingSalaryService>;
    variableAverageService = {
      calculate: mockVariableAvgCalc,
    } as unknown as jest.Mocked<VariableAverageService>;
    payrollConcepts = {
      resolveEffective: mockResolveEffective,
    } as unknown as jest.Mocked<PayrollConceptsService>;
    prisma = {
      employeeSalaryHistory: { findFirst: mockSalaryFindFirst },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalSettlementAggregatorService,
        { provide: LaborLegalParametersService, useValue: legalParams },
        { provide: EmployeeContractRepository, useValue: contractRepo },
        { provide: EmployeeHistoryRepository, useValue: {} },
        { provide: CesantiasService, useValue: cesantiasService },
        { provide: PrimaService, useValue: primaService },
        { provide: VacationsService, useValue: vacationsService },
        {
          provide: IndemnificationCalculationService,
          useValue: new IndemnificationCalculationService(),
        },
        { provide: PendingSalaryService, useValue: pendingSalaryService },
        { provide: VariableAverageService, useValue: variableAverageService },
        { provide: PayrollConceptsService, useValue: payrollConcepts },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FinalSettlementAggregatorService>(FinalSettlementAggregatorService);
  });

  const baseInput = (): {
    tenantId: string;
    employeeDetailsId: string;
    effectiveTerminationDate: Date;
    terminationReason: 'RENUNCIA';
  } => ({
    tenantId: TENANT_ID,
    employeeDetailsId: EMPLOYEE_ID,
    effectiveTerminationDate: TERMINATION_DATE,
    terminationReason: 'RENUNCIA' as const,
  });

  // ── preview sin persistencia ────────────────────────────────────────────

  it('no persiste — solo llama a los servicios de consulta', async (): Promise<void> => {
    // Act
    const result = await service.aggregate(baseInput());

    // Assert
    expect(result.grossDevengados).toBeDefined();
    expect(mockSalaryFindFirst).toHaveBeenCalledTimes(1);
    expect(mockGetEmployeeBalance).toHaveBeenCalledTimes(1);
    expect(mockGetPrimaBalance).toHaveBeenCalledTimes(1);
    expect(mockCalculateVacBalance).toHaveBeenCalledTimes(1);
    expect(mockPendingSalaryCalc).toHaveBeenCalledTimes(1);
  });

  // ── consolidación sin doble pago ────────────────────────────────────────

  it('genera líneas sin duplicar — cada concepto aparece una sola vez', async (): Promise<void> => {
    // Act
    const result = await service.aggregate(baseInput());

    // Assert — cada código de concepto debe aparecer 0 o 1 vez
    const codes = result.lines.map((l): string => l.code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it('nombres de líneas automáticas vienen del catálogo efectivo (OS-612)', async (): Promise<void> => {
    mockResolveEffective.mockImplementation(
      async (
        _tenantId: string,
        code: string,
      ): Promise<{
        id: string;
        code: string;
        displayName: string;
        lineNature: string;
        isTenantOverride: boolean;
        overrideId: null;
      }> => ({
        id: `global-${code}`,
        code,
        displayName: `LABEL-${code}`,
        lineNature: 'DEVENGO',
        isTenantOverride: false,
        overrideId: null,
      }),
    );

    const result = await service.aggregate(baseInput());

    for (const line of result.lines) {
      expect(line.origin).toBe('AUTOMATIC');
      expect(line.name).toBe(`LABEL-${line.code}`);
      expect(line.conceptId).toBe(`global-${line.code}`);
      expect(mockResolveEffective).toHaveBeenCalledWith(TENANT_ID, line.code);
    }
  });

  // ── cálculo de totales ──────────────────────────────────────────────────

  it('grossDevengados = suma de todas las líneas DEVENGO', async (): Promise<void> => {
    // Act
    const result = await service.aggregate(baseInput());

    const sumDevengos = result.lines
      .filter((l): boolean => l.type === 'DEVENGO')
      .reduce((acc, l): Prisma.Decimal => acc.plus(l.amount), new Prisma.Decimal(0));

    // Assert
    expect(Number(result.grossDevengados)).toBeCloseTo(sumDevengos.toNumber(), 2);
  });

  it('netAmount = grossDevengados - totalDeducciones', async (): Promise<void> => {
    // Act
    const result = await service.aggregate(baseInput());

    // Assert
    const expected = Number(result.grossDevengados) - Number(result.totalDeducciones);
    expect(Number(result.netAmount)).toBeCloseTo(Math.max(0, expected), 2);
  });

  // ── netAmount nunca negativo ────────────────────────────────────────────

  it('congela netAmount en 0 cuando las deducciones superan los devengos', async (): Promise<void> => {
    // Arrange — forzar cero en todos los devengos
    mockPendingSalaryCalc.mockResolvedValueOnce({
      periodStart: new Date('2024-06-01'),
      periodEnd: TERMINATION_DATE,
      calendarDays: 30,
      commercialDays: 30,
      monthlySalary: '0.00',
      dailySalary: '0.00',
      basePendingSalary: '0.00',
      novedadDeductions: '0.00',
      pendingOvertimeAmount: '0.00',
      totalPendingSalary: '0.00',
      breakdown: [],
      sources: [],
      warnings: [],
    });
    mockGetPrimaBalance.mockResolvedValueOnce({
      pendingAmount: '0.00',
      accruedAmount: '0.00',
      paidAmount: '0.00',
      overpaymentAmount: '0.00',
      baseAmount: '0.00',
      sourceLiquidations: [],
      segments: [],
      divisorSnapshot: '180',
      asOfDate: TERMINATION_DATE,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: TERMINATION_DATE,
    });
    mockGetEmployeeBalance.mockResolvedValueOnce({
      pendingCesantias: '0.00',
      pendingInterest: '0.00',
      calculationBase: '0.00',
      sourceLiquidations: [],
      statesConsidered: {
        pendingCesantiasStatuses: [],
        excludedCesantiasStatuses: [],
        pendingInterestStatuses: [],
        excludedInterestStatuses: [],
      },
      legalParametersSnapshot: {
        interestRate: '0.12',
        divisor: '360',
        transportSubsidyAmount: '162000',
        transportSubsidyThreshold: '2600000',
      },
      asOfDate: TERMINATION_DATE,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: TERMINATION_DATE,
    });
    mockCalculateVacBalance.mockResolvedValueOnce({ pendingDays: new Prisma.Decimal('0') });

    // Act
    const result = await service.aggregate(baseInput());

    // Assert
    expect(Number(result.netAmount)).toBeGreaterThanOrEqual(0);
  });

  // ── bloqueos ────────────────────────────────────────────────────────────

  it('agrega bloque cuando no hay contrato ACTIVO', async (): Promise<void> => {
    // Arrange
    mockFindActiveContract.mockResolvedValueOnce(null);

    // Act
    const result = await service.aggregate(baseInput());

    // Assert
    expect(result.blocks.some((b): boolean => b.includes('no_active_contract'))).toBe(true);
  });

  it('agrega bloque cuando variable average es unresolvable', async (): Promise<void> => {
    // Arrange
    mockVariableAvgCalc.mockResolvedValueOnce({
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      monthsCovered: 6,
      daysCovered: 182,
      totalVariable: '100000.00',
      monthlyAverage: '0.00',
      includedConcepts: ['OVERTIME'],
      payrollSources: ['OvertimeRequest:123'],
      unresolvable: true,
      warnings: ['variable_avg_no_salary_history'],
    });

    // Act
    const result = await service.aggregate(baseInput());

    // Assert
    expect(result.blocks.some((b): boolean => b.includes('variable_avg_unresolvable'))).toBe(true);
  });

  // ── indemnización solo cuando SIN_JUSTA_CAUSA ──────────────────────────

  it('incluye línea INDEMNIZACION solo para SIN_JUSTA_CAUSA', async (): Promise<void> => {
    // Arrange — mismo contrato indefinido, razón SIN_JUSTA_CAUSA, bajo umbral
    const inputSJC = { ...baseInput(), terminationReason: 'SIN_JUSTA_CAUSA' as const };
    const inputRenuncia = { ...baseInput(), terminationReason: 'RENUNCIA' as const };

    // Act
    const [sjcResult, renunciaResult] = await Promise.all([
      service.aggregate(inputSJC),
      service.aggregate(inputRenuncia),
    ]);

    // Assert
    expect(sjcResult.lines.some((l): boolean => l.code === 'INDEMNIZACION')).toBe(true);
    expect(renunciaResult.lines.some((l): boolean => l.code === 'INDEMNIZACION')).toBe(false);
  });

  // ── aislamiento multi-tenant ────────────────────────────────────────────

  it('consulta por tenantId — no mezcla datos de otros tenants', async (): Promise<void> => {
    // Arrange
    const inputTenantA = { ...baseInput(), tenantId: 'tenant-A' };
    await service.aggregate(inputTenantA);

    // Assert — las llamadas a los sub-servicios recibieron tenant-A
    expect(mockFindActiveContract).toHaveBeenCalledWith('tenant-A', expect.any(String));
    expect(mockGetEmployeeBalance).toHaveBeenCalledWith(
      'tenant-A',
      expect.any(String),
      expect.any(Date),
    );
  });

  // ── snapshots se incluyen en el resultado ──────────────────────────────

  it('retorna snapshots de salario y parámetros legales', async (): Promise<void> => {
    // Act
    const result = await service.aggregate(baseInput());

    // Assert
    expect(result.snapshots.monthlySalary).toBeDefined();
    expect(result.snapshots.smlvAmount).toBeDefined();
    expect(result.snapshots.formulaVersion).toBe(1);
  });
});
