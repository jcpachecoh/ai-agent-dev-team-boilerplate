import { OvertimeStatus, Prisma, type LaborLegalParameter } from '@prisma/client';

import type { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { LegalParameterSnapshot } from '../../labor-legal-parameters/service/legal-parameter-snapshot';
import type { PrismaService } from '../../prisma/prisma.service';
import { VariableAverageService } from '../service/variable-average.service';

function legalParam(
  key: string,
  value: number,
  overrides: Partial<LaborLegalParameter> = {},
): LaborLegalParameter {
  return {
    id: `param-${key}`,
    tenantId: null,
    tenantScope: 'GLOBAL',
    key,
    value: new Prisma.Decimal(value),
    validFrom: new Date('2020-01-01'),
    validTo: null,
    source: 'test',
    deletedAt: null,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    ...overrides,
  } as LaborLegalParameter;
}

const DEFAULT_LEGAL_ROWS: LaborLegalParameter[] = [
  legalParam('HORARIO_NOCTURNO_INICIO', 21),
  legalParam('RECARGO_DOMINICAL_FESTIVO', 0.75),
  legalParam('RECARGO_HORA_EXTRA_DIURNA', 0.25),
  legalParam('RECARGO_HORA_EXTRA_NOCTURNA', 0.75),
];

function overtimeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ot-1',
    accumulatedMinutes: 120,
    shiftEndTime: new Date('2026-03-16T19:00:00.000Z'),
    actualEndTime: new Date('2026-03-16T21:00:00.000Z'),
    payrollPeriod: '2026-03',
    ...overrides,
  };
}

function salaryEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'salhist-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    salaryType: 'ORDINARIO',
    salaryAmount: new Prisma.Decimal(2400000),
    effectiveFrom: new Date('2020-01-01'),
    effectiveTo: null,
    changedBy: null,
    createdAt: new Date('2020-01-01'),
    ...overrides,
  };
}

// Ventana de 6 meses que cubre tanto los casos de marzo 2026 como los festivos de enero 2026.
const EFFECTIVE_TERMINATION_DATE = new Date(2026, 5, 30);
const CONTRACT_START_DATE = new Date(2020, 0, 1);

describe('VariableAverageService', (): void => {
  let service: VariableAverageService;
  let findManyOvertime: jest.Mock;
  let findManySalary: jest.Mock;
  let preload: jest.Mock;

  beforeEach((): void => {
    findManyOvertime = jest.fn().mockResolvedValue([]);
    findManySalary = jest.fn().mockResolvedValue([salaryEntry()]);
    preload = jest.fn().mockResolvedValue(new LegalParameterSnapshot(DEFAULT_LEGAL_ROWS, null));

    const prisma = {
      overtimeRequest: { findMany: findManyOvertime },
      employeeSalaryHistory: { findMany: findManySalary },
    } as unknown as PrismaService;

    const legalParamsService = { preload } as unknown as LaborLegalParametersService;

    service = new VariableAverageService(prisma, legalParamsService);
  });

  it('clasifica un tramo diurno entre semana como DIURNO (recargo 25%)', async (): Promise<void> => {
    findManyOvertime.mockResolvedValue([
      overtimeRow({
        // Bogotá 14:00-16:00, lunes 16-mar-2026 (no festivo)
        shiftEndTime: new Date('2026-03-16T19:00:00.000Z'),
        actualEndTime: new Date('2026-03-16T21:00:00.000Z'),
      }),
    ]);

    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      CONTRACT_START_DATE,
    );

    // hourlyRate = 2400000/240 = 10000; amount = 10000 * 1.25 * 2h = 25000
    expect(result.totalVariable).toBe('25000.00');
    expect(result.includedConcepts).toEqual(['OVERTIME:DIURNO']);
    expect(result.unresolvable).toBe(false);
  });

  it('clasifica un tramo nocturno entre semana como NOCTURNO (recargo 75%)', async (): Promise<void> => {
    findManyOvertime.mockResolvedValue([
      overtimeRow({
        // Bogotá 21:00-23:00 del 16-mar-2026 (no festivo)
        shiftEndTime: new Date('2026-03-17T02:00:00.000Z'),
        actualEndTime: new Date('2026-03-17T04:00:00.000Z'),
      }),
    ]);

    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      CONTRACT_START_DATE,
    );

    // amount = 10000 * 1.75 * 2h = 35000
    expect(result.totalVariable).toBe('35000.00');
    expect(result.includedConcepts).toEqual(['OVERTIME:NOCTURNO']);
  });

  it('clasifica un tramo festivo diurno (Año Nuevo) como FESTIVO_DIURNO (recargo dominical/festivo)', async (): Promise<void> => {
    findManyOvertime.mockResolvedValue([
      overtimeRow({
        // Bogotá 14:00-16:00 del 1-ene-2026 (festivo)
        shiftEndTime: new Date('2026-01-01T19:00:00.000Z'),
        actualEndTime: new Date('2026-01-01T21:00:00.000Z'),
      }),
    ]);

    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      CONTRACT_START_DATE,
    );

    // amount = 10000 * 1.75 (1 + RECARGO_DOMINICAL_FESTIVO 0.75) * 2h = 35000
    expect(result.totalVariable).toBe('35000.00');
    expect(result.includedConcepts).toEqual(['OVERTIME:FESTIVO_DIURNO']);
  });

  it('clasifica un tramo festivo nocturno (Año Nuevo) como FESTIVO_NOCTURNO (recargo combinado)', async (): Promise<void> => {
    findManyOvertime.mockResolvedValue([
      overtimeRow({
        // Bogotá 21:00-23:00 del 1-ene-2026 (festivo + nocturno)
        shiftEndTime: new Date('2026-01-02T02:00:00.000Z'),
        actualEndTime: new Date('2026-01-02T04:00:00.000Z'),
      }),
    ]);

    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      CONTRACT_START_DATE,
    );

    // surcharge = RECARGO_HORA_EXTRA_NOCTURNA (0.75) + RECARGO_DOMINICAL_FESTIVO (0.75) = 1.5
    // amount = 10000 * 2.5 * 2h = 50000
    expect(result.totalVariable).toBe('50000.00');
    expect(result.includedConcepts).toEqual(['OVERTIME:FESTIVO_NOCTURNO']);
  });

  it('excluye solicitudes rechazadas/anuladas a nivel de consulta (solo APROBADA, deletedAt=null)', async (): Promise<void> => {
    await service.calculate('tenant-1', 'emp-1', EFFECTIVE_TERMINATION_DATE, CONTRACT_START_DATE);

    expect(findManyOvertime).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: OvertimeStatus.APROBADA,
          deletedAt: null,
        }),
      }),
    );
  });

  it('acota la consulta a la ventana de 6 meses — un tramo fuera de rango nunca se pediría', async (): Promise<void> => {
    await service.calculate('tenant-1', 'emp-1', EFFECTIVE_TERMINATION_DATE, CONTRACT_START_DATE);

    const [args] = findManyOvertime.mock.calls[0] as [
      { where: { shiftEndTime: { gte: Date; lte: Date } } },
    ];
    const { gte, lte } = args.where.shiftEndTime;

    expect(lte).toEqual(EFFECTIVE_TERMINATION_DATE);
    // windowStart = 6 meses antes de la terminación, día 1 del mes
    expect(gte.getFullYear()).toBe(2025);
    expect(gte.getMonth()).toBe(11); // diciembre (0-indexed)
    expect(gte.getDate()).toBe(1);
  });

  it('advierte y acota monthsCovered cuando el contrato inició hace menos de 6 meses', async (): Promise<void> => {
    const recentContractStart = new Date(2026, 4, 1); // 1-may-2026, ~2 meses antes de la terminación

    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      recentContractStart,
    );

    expect(
      result.warnings.some((w): boolean => w.startsWith('variable_avg_less_than_6_months')),
    ).toBe(true);
    expect(result.monthsCovered).toBeLessThan(6);
  });

  it('devuelve totales en cero sin solicitudes de horas extra aprobadas', async (): Promise<void> => {
    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      CONTRACT_START_DATE,
    );

    expect(result.totalVariable).toBe('0.00');
    expect(result.monthlyAverage).toBe('0.00');
    expect(result.includedConcepts).toEqual([]);
    expect(result.unresolvable).toBe(false);
  });

  it('marca unresolvable=true si hay overtime aprobado pero no hay historial salarial', async (): Promise<void> => {
    findManyOvertime.mockResolvedValue([overtimeRow()]);
    findManySalary.mockResolvedValue([]);

    const result = await service.calculate(
      'tenant-1',
      'emp-1',
      EFFECTIVE_TERMINATION_DATE,
      CONTRACT_START_DATE,
    );

    expect(result.unresolvable).toBe(true);
    expect(
      result.warnings.some((w): boolean => w.startsWith('variable_avg_no_salary_history')),
    ).toBe(true);
  });
});
