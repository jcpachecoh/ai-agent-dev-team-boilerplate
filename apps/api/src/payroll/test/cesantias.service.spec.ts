import { NotFoundException } from '@nestjs/common';
import { EmployeeContractType, Prisma, SalaryType, type LaborLegalParameter } from '@prisma/client';

import type { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { LegalParameterSnapshot } from '../../labor-legal-parameters/service/legal-parameter-snapshot';
import type {
  CesantiasLiquidationRecord,
  UpsertCesantiasLiquidationData,
} from '../interfaces/cesantias.interfaces';
import type { CesantiasRepository } from '../repository/cesantias.repository';
import type { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import type { PayrollRepository } from '../repository/payroll.repository';
import { CesantiasCalculationService } from '../service/cesantias-calculation.service';
import { CesantiasService } from '../service/cesantias.service';

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
  legalParam('INTERES_CESANTIAS', 0.12),
  legalParam('DIVISOR_CESANTIAS', 360),
  legalParam('AUXILIO_TRANSPORTE', 249095),
  legalParam('SMLV', 1750905),
];

function employee(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    hireDate: new Date('2020-01-01'),
    contractStart: new Date('2020-01-01'),
    contractEnd: null,
    contractType: EmployeeContractType.INDEFINIDO,
    hasTransportSubsidy: false,
    isActive: true,
    deletedAt: null,
    ...overrides,
  };
}

function salaryEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'salhist-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: '2500000',
    effectiveFrom: new Date('2020-01-01'),
    effectiveTo: null,
    changedBy: null,
    createdAt: new Date('2020-01-01'),
    ...overrides,
  };
}

function fundEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'fundhist-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    fundType: 'CESANTIAS_FUND',
    fundName: 'Porvenir',
    effectiveFrom: new Date('2020-01-01'),
    effectiveTo: null,
    changedBy: null,
    createdAt: new Date('2020-01-01'),
    ...overrides,
  };
}

/** Extrae el payload escrito en la N-ésima llamada a saveCalculations, tipado (evita no-unsafe-member-access sobre `.mock.calls`, que Jest tipa como `any[][]`). */
function writtenAt(mockFn: jest.Mock, callIndex = 0): UpsertCesantiasLiquidationData {
  return (mockFn.mock.calls as UpsertCesantiasLiquidationData[][][])[callIndex][0][0];
}

describe('CesantiasService.calculateForYear', (): void => {
  let service: CesantiasService;
  let findAllEmployees: jest.Mock;
  let findManyWithPersonalDataByIds: jest.Mock;
  let findSalaryHistoryByEmployees: jest.Mock;
  let findFundHistoryByEmployees: jest.Mock;
  let findMapByTenantAndYear: jest.Mock;
  let saveCalculations: jest.Mock;
  let preload: jest.Mock;
  let findByTenantAndYear: jest.Mock;
  let countByTenantAndYear: jest.Mock;
  let findById: jest.Mock;
  let countPendingByTenantAndYear: jest.Mock;
  let countExportableByTenantYearAndChannel: jest.Mock;
  let getValueAt: jest.Mock;
  let findByIdPayroll: jest.Mock;
  let findSalaryHistoryByEmployee: jest.Mock;
  let findAllByEmployee: jest.Mock;

  beforeEach((): void => {
    findAllEmployees = jest.fn().mockResolvedValue([employee()]);
    findManyWithPersonalDataByIds = jest.fn().mockResolvedValue([]);
    findSalaryHistoryByEmployees = jest
      .fn()
      .mockResolvedValue(new Map([['emp-1', [salaryEntry()]]]));
    findFundHistoryByEmployees = jest.fn().mockResolvedValue(new Map([['emp-1', [fundEntry()]]]));
    findMapByTenantAndYear = jest.fn().mockResolvedValue(new Map());
    saveCalculations = jest
      .fn()
      .mockImplementation((items: UpsertCesantiasLiquidationData[]): CesantiasLiquidationRecord[] =>
        items.map(
          (item, i): CesantiasLiquidationRecord => ({
            id: `liq-${i}`,
            tenantId: item.tenantId,
            employeeId: item.employeeId,
            year: item.year,
            periodStart: item.periodStart,
            periodEnd: item.periodEnd,
            accrualDays: item.accrualDays,
            calculationBase: item.calculationBase.toString(),
            cesantiasAmount: item.cesantiasAmount.toString(),
            interestAmount: item.interestAmount.toString(),
            interestRateSnapshot: item.interestRateSnapshot.toString(),
            fundNameSnapshot: item.fundNameSnapshot,
            fundChannelSnapshot: item.fundChannelSnapshot,
            cesantiasStatus: 'CALCULADA',
            interestStatus: 'CALCULADO',
            calculatedBy: item.calculatedBy ?? null,
            calculatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      );
    preload = jest
      .fn()
      .mockResolvedValue(new LegalParameterSnapshot(DEFAULT_LEGAL_ROWS, 'tenant-1'));
    findByTenantAndYear = jest.fn().mockResolvedValue([]);
    countByTenantAndYear = jest.fn().mockResolvedValue(0);
    findById = jest.fn().mockResolvedValue(null);
    countPendingByTenantAndYear = jest.fn().mockResolvedValue(0);
    countExportableByTenantYearAndChannel = jest.fn().mockResolvedValue(0);
    findByIdPayroll = jest.fn().mockResolvedValue(employee());
    findSalaryHistoryByEmployee = jest.fn().mockResolvedValue([salaryEntry()]);
    findAllByEmployee = jest.fn().mockResolvedValue([]);
    getValueAt = jest.fn().mockImplementation((key: string): Promise<number> => {
      if (key === 'CESANTIAS_PLAZO_DIA') {
        return Promise.resolve(14);
      }
      if (key === 'CESANTIAS_PLAZO_MES') {
        return Promise.resolve(2);
      }
      throw new Error(`unexpected key in test: ${key}`);
    });

    const payrollRepository = {
      findAll: findAllEmployees,
      findManyWithPersonalDataByIds,
      findById: findByIdPayroll,
    } as unknown as PayrollRepository;
    const employeeHistoryRepository = {
      findSalaryHistoryByEmployees,
      findFundHistoryByEmployees,
      findSalaryHistoryByEmployee,
    } as unknown as EmployeeHistoryRepository;
    const cesantiasRepository = {
      findMapByTenantAndYear,
      saveCalculations,
      findByTenantAndYear,
      countByTenantAndYear,
      findById,
      countPendingByTenantAndYear,
      countExportableByTenantYearAndChannel,
      findAllByEmployee,
    } as unknown as CesantiasRepository;
    const legalParametersService = {
      preload,
      getValueAt,
    } as unknown as LaborLegalParametersService;

    service = new CesantiasService(
      cesantiasRepository,
      payrollRepository,
      employeeHistoryRepository,
      new CesantiasCalculationService(),
      legalParametersService,
    );
  });

  it('rejects a year outside the allowed range (año fuera de rango)', async (): Promise<void> => {
    await expect(service.calculateForYear('tenant-1', 1999)).rejects.toThrow('Año inválido');
    await expect(service.calculateForYear('tenant-1', 2200)).rejects.toThrow('Año inválido');
  });

  it('calculates a full year for an employee active all year', async (): Promise<void> => {
    const result = await service.calculateForYear('tenant-1', 2020, 'user-9');

    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(saveCalculations).toHaveBeenCalledWith([
      expect.objectContaining({
        employeeId: 'emp-1',
        accrualDays: 360,
        cesantiasAmount: expect.anything(),
      }),
    ]);
  });

  it('prorates an employee hired mid-year (ingreso durante el año)', async (): Promise<void> => {
    findAllEmployees.mockResolvedValue([employee({ hireDate: new Date('2020-04-01') })]);
    findSalaryHistoryByEmployees.mockResolvedValue(
      new Map([['emp-1', [salaryEntry({ effectiveFrom: new Date('2020-04-01') })]]]),
    );

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    expect(written.accrualDays).toBe(270); // abril-diciembre, 9 meses × 30
  });

  it('prorates an employee terminated mid-year (retiro durante el año)', async (): Promise<void> => {
    findAllEmployees.mockResolvedValue([employee({ contractEnd: new Date('2020-09-15') })]);

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    // enero 1 - septiembre 16 (exclusivo, día siguiente al retiro) = 255 días comerciales
    expect(written.accrualDays).toBe(255);
  });

  it('reconstructs two salary tramos for a mid-year raise (cambio salarial durante el año)', async (): Promise<void> => {
    findSalaryHistoryByEmployees.mockResolvedValue(
      new Map([
        [
          'emp-1',
          [
            salaryEntry({
              salaryAmount: '2000000',
              effectiveFrom: new Date('2020-01-01'),
              effectiveTo: new Date('2020-07-01'),
            }),
            salaryEntry({
              salaryAmount: '2500000',
              effectiveFrom: new Date('2020-07-01'),
              effectiveTo: null,
            }),
          ],
        ],
      ]),
    );

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    expect(written.accrualDays).toBe(360);
    expect(written.cesantiasAmount.toString()).toBe('2250000');
  });

  it('excludes INTEGRAL-type segments when the employee switched contract salary type mid-year', async (): Promise<void> => {
    findSalaryHistoryByEmployees.mockResolvedValue(
      new Map([
        [
          'emp-1',
          [
            salaryEntry({
              salaryType: SalaryType.INTEGRAL,
              salaryAmount: '20000000',
              effectiveFrom: new Date('2020-01-01'),
              effectiveTo: new Date('2020-07-01'),
            }),
            salaryEntry({
              salaryAmount: '2500000',
              effectiveFrom: new Date('2020-07-01'),
              effectiveTo: null,
            }),
          ],
        ],
      ]),
    );

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    // Solo cuenta el tramo ORDINARIO (180 días) — el INTEGRAL (180 días) queda excluido.
    expect(written.accrualDays).toBe(180);
  });

  it('skips an employee with no salary history at all (periodo sin historial completo)', async (): Promise<void> => {
    findSalaryHistoryByEmployees.mockResolvedValue(new Map());

    const result = await service.calculateForYear('tenant-1', 2020);

    expect(result.skipped).toContainEqual({
      employeeId: 'emp-1',
      reason: 'SIN_HISTORIAL_SALARIAL',
    });
    expect(saveCalculations).toHaveBeenCalledWith([]);
  });

  it('skips an employee with no cesantías fund on record (empleado sin fondo)', async (): Promise<void> => {
    findFundHistoryByEmployees.mockResolvedValue(new Map());

    const result = await service.calculateForYear('tenant-1', 2020);

    expect(result.skipped).toContainEqual({
      employeeId: 'emp-1',
      reason: 'SIN_FONDO_CESANTIAS_VIGENTE',
    });
  });

  it('snapshots FNA as the fund channel for "Fondo Nacional del Ahorro"', async (): Promise<void> => {
    findFundHistoryByEmployees.mockResolvedValue(
      new Map([['emp-1', [fundEntry({ fundName: 'Fondo Nacional del Ahorro' })]]]),
    );

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    expect(written.fundChannelSnapshot).toBe('FNA');
    expect(written.fundNameSnapshot).toBe('Fondo Nacional del Ahorro');
  });

  it('snapshots PRIVATE_OPERATOR for a private fund', async (): Promise<void> => {
    findFundHistoryByEmployees.mockResolvedValue(
      new Map([['emp-1', [fundEntry({ fundName: 'Protección' })]]]),
    );

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    expect(written.fundChannelSnapshot).toBe('PRIVATE_OPERATOR');
  });

  it('snapshots the fund vigente al cierre when the employee changed funds during the year', async (): Promise<void> => {
    findFundHistoryByEmployees.mockResolvedValue(
      new Map([
        [
          'emp-1',
          [
            fundEntry({
              fundName: 'Protección',
              effectiveFrom: new Date('2020-01-01'),
              effectiveTo: new Date('2020-09-01'),
            }),
            fundEntry({
              fundName: 'Fondo Nacional del Ahorro',
              effectiveFrom: new Date('2020-09-01'),
              effectiveTo: null,
            }),
          ],
        ],
      ]),
    );

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    expect(written.fundNameSnapshot).toBe('Fondo Nacional del Ahorro');
    expect(written.fundChannelSnapshot).toBe('FNA');
  });

  it('skips an employee with an invalid (non-positive) salary segment (base inválida)', async (): Promise<void> => {
    findSalaryHistoryByEmployees.mockResolvedValue(
      new Map([['emp-1', [salaryEntry({ salaryAmount: '0' })]]]),
    );

    const result = await service.calculateForYear('tenant-1', 2020);

    expect(result.skipped).toContainEqual({ employeeId: 'emp-1', reason: 'BASE_INVALIDA' });
  });

  it('skips an employee whose employment window does not overlap the year at all', async (): Promise<void> => {
    // Contratado y retirado en 2019, antes de que empiece el año calculado (2020).
    findAllEmployees.mockResolvedValue([
      employee({ hireDate: new Date('2019-01-01'), contractEnd: new Date('2019-06-30') }),
    ]);

    const result = await service.calculateForYear('tenant-1', 2020);

    expect(result.skipped).toEqual([{ employeeId: 'emp-1', reason: 'SIN_TRASLAPE_EN_EL_ANIO' }]);
    expect(result.created).toBe(0);
    // Ningún candidato -> retorna temprano, sin consultar historiales, parámetros legales
    // ni abrir la transacción de escritura.
    expect(findSalaryHistoryByEmployees).not.toHaveBeenCalled();
    expect(preload).not.toHaveBeenCalled();
    expect(saveCalculations).not.toHaveBeenCalled();
  });

  it('excludes PRESTACION and APRENDIZAJE contract types (no causan cesantías tradicionales)', async (): Promise<void> => {
    findAllEmployees.mockResolvedValue([
      employee({ id: 'emp-1', contractType: EmployeeContractType.PRESTACION }),
    ]);

    const result = await service.calculateForYear('tenant-1', 2020);

    expect(result.skipped).toContainEqual({
      employeeId: 'emp-1',
      reason: 'TIPO_CONTRATO_EXCLUIDO',
    });
  });

  it('isolates every read by tenantId (aislamiento por tenant)', async (): Promise<void> => {
    await service.calculateForYear('tenant-1', 2020);

    expect(findAllEmployees).toHaveBeenCalledWith({ tenantId: 'tenant-1', includeInactive: true });
    expect(findSalaryHistoryByEmployees).toHaveBeenCalledWith('tenant-1', ['emp-1']);
    expect(findFundHistoryByEmployees).toHaveBeenCalledWith(
      'tenant-1',
      ['emp-1'],
      'CESANTIAS_FUND',
    );
    expect(findMapByTenantAndYear).toHaveBeenCalledWith('tenant-1', 2020);
    expect(preload).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      'tenant-1',
    );
  });

  it('resolves legal parameters by vigencia (distintos valores para distintos años)', async (): Promise<void> => {
    const rows2020 = [
      legalParam('INTERES_CESANTIAS', 0.1, {
        validFrom: new Date('2019-01-01'),
        validTo: new Date('2020-12-31T23:59:59.999Z'),
      }),
      legalParam('DIVISOR_CESANTIAS', 360),
      legalParam('AUXILIO_TRANSPORTE', 100000),
      legalParam('SMLV', 1000000),
    ];
    preload.mockResolvedValue(new LegalParameterSnapshot(rows2020, 'tenant-1'));

    await service.calculateForYear('tenant-1', 2020);

    const written = writtenAt(saveCalculations);
    expect(written.interestRateSnapshot.toString()).toBe('0.1');
  });

  it('throws when a required legal parameter has no vigencia covering the period (parámetro legal inexistente)', async (): Promise<void> => {
    preload.mockResolvedValue(
      new LegalParameterSnapshot([legalParam('DIVISOR_CESANTIAS', 360)], 'tenant-1'),
    );

    await expect(service.calculateForYear('tenant-1', 2020)).rejects.toThrow(NotFoundException);
    expect(saveCalculations).not.toHaveBeenCalled();
  });

  describe('idempotencia y recálculo', (): void => {
    it('calling it twice does not duplicate (misma llave employeeId+year)', async (): Promise<void> => {
      await service.calculateForYear('tenant-1', 2020);
      await service.calculateForYear('tenant-1', 2020);

      expect(saveCalculations).toHaveBeenCalledTimes(2);
      // Ambas corridas escriben para el mismo employeeId — el repository (probado aparte)
      // es quien garantiza que la segunda es un UPDATE, no un INSERT duplicado.
      expect(writtenAt(saveCalculations, 0).employeeId).toBe('emp-1');
      expect(writtenAt(saveCalculations, 1).employeeId).toBe('emp-1');
    });

    it('does not recalculate a liquidation with cesantías consignadas (no sobrescribe liquidaciones cerradas)', async (): Promise<void> => {
      findMapByTenantAndYear.mockResolvedValue(
        new Map([
          [
            'emp-1',
            {
              id: 'liq-existing',
              tenantId: 'tenant-1',
              employeeId: 'emp-1',
              year: 2020,
              cesantiasStatus: 'CONSIGNADA',
              interestStatus: 'CALCULADO',
            } as unknown as CesantiasLiquidationRecord,
          ],
        ]),
      );

      const result = await service.calculateForYear('tenant-1', 2020);

      expect(result.skipped).toContainEqual({ employeeId: 'emp-1', reason: 'LIQUIDACION_CERRADA' });
      expect(saveCalculations).toHaveBeenCalledWith([]);
    });

    it('does not recalculate a liquidation with intereses pagados (no modifica snapshots cerrados)', async (): Promise<void> => {
      findMapByTenantAndYear.mockResolvedValue(
        new Map([
          [
            'emp-1',
            {
              id: 'liq-existing',
              tenantId: 'tenant-1',
              employeeId: 'emp-1',
              year: 2020,
              cesantiasStatus: 'CALCULADA',
              interestStatus: 'PAGADO',
            } as unknown as CesantiasLiquidationRecord,
          ],
        ]),
      );

      const result = await service.calculateForYear('tenant-1', 2020);

      expect(result.skipped).toContainEqual({ employeeId: 'emp-1', reason: 'LIQUIDACION_CERRADA' });
    });

    it('does recalculate a liquidation that is only CALCULADA/CALCULADO (nada cerrado todavía)', async (): Promise<void> => {
      findMapByTenantAndYear.mockResolvedValue(
        new Map([
          [
            'emp-1',
            {
              id: 'liq-existing',
              tenantId: 'tenant-1',
              employeeId: 'emp-1',
              year: 2020,
              cesantiasStatus: 'CALCULADA',
              interestStatus: 'CALCULADO',
            } as unknown as CesantiasLiquidationRecord,
          ],
        ]),
      );

      const result = await service.calculateForYear('tenant-1', 2020);

      expect(result.skipped).toEqual([]);
      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
    });
  });

  describe('listByYear / getDetail', (): void => {
    it('delegates listing with pagination and tenant scoping', async (): Promise<void> => {
      await service.listByYear('tenant-1', 2020, { limit: 10, offset: 5 });

      expect(findByTenantAndYear).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        year: 2020,
        limit: 10,
        offset: 5,
      });
      expect(countByTenantAndYear).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        year: 2020,
        limit: 10,
        offset: 5,
      });
    });

    it('resuelve employeeName en batch para cada fila (sin employeeId técnico en el response)', async (): Promise<void> => {
      findByTenantAndYear.mockResolvedValue([
        { id: 'liq-1', employeeId: 'emp-1' } as CesantiasLiquidationRecord,
        { id: 'liq-2', employeeId: 'emp-2' } as CesantiasLiquidationRecord,
      ]);
      findManyWithPersonalDataByIds.mockResolvedValue([
        { id: 'emp-1', name: 'Ana Gómez' },
        { id: 'emp-2', name: 'Luis Pérez' },
      ]);

      const result = await service.listByYear('tenant-1', 2020, {});

      expect(findManyWithPersonalDataByIds).toHaveBeenCalledWith('tenant-1', ['emp-1', 'emp-2']);
      expect(result.items[0].employeeName).toBe('Ana Gómez');
      expect(result.items[1].employeeName).toBe('Luis Pérez');
    });

    it('usa un fallback legible si el empleado no aparece en la resolución batch', async (): Promise<void> => {
      findByTenantAndYear.mockResolvedValue([
        { id: 'liq-1', employeeId: 'emp-missing' } as CesantiasLiquidationRecord,
      ]);
      findManyWithPersonalDataByIds.mockResolvedValue([]);

      const result = await service.listByYear('tenant-1', 2020, {});

      expect(result.items[0].employeeName).toBe('Empleado no encontrado');
    });

    it('getDetail throws NotFoundException for a missing or cross-tenant id', async (): Promise<void> => {
      findById.mockResolvedValue(null);

      await expect(service.getDetail('tenant-1', 'missing-id')).rejects.toThrow(NotFoundException);
    });

    it('getDetail returns the record when found', async (): Promise<void> => {
      const record = { id: 'liq-1', tenantId: 'tenant-1' } as CesantiasLiquidationRecord;
      findById.mockResolvedValue(record);

      const result = await service.getDetail('tenant-1', 'liq-1');

      expect(findById).toHaveBeenCalledWith('tenant-1', 'liq-1');
      expect(result).toBe(record);
    });
  });

  describe('getAlertSummary', (): void => {
    afterEach((): void => {
      jest.useRealTimers();
    });

    it('resuelve targetYear como el último año calendario cerrado y consulta pendientes de ese año', async (): Promise<void> => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(3);

      const result = await service.getAlertSummary('tenant-1');

      expect(countPendingByTenantAndYear).toHaveBeenCalledWith('tenant-1', 2025);
      expect(result.targetYear).toBe(2025);
      expect(result.pendingCount).toBe(3);
    });

    it('lee el día/mes límite desde LaborLegalParameter, scoped por tenant — nunca hardcodeado', async (): Promise<void> => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));

      await service.getAlertSummary('tenant-1');

      expect(getValueAt).toHaveBeenCalledWith('CESANTIAS_PLAZO_DIA', expect.any(Date), 'tenant-1');
      expect(getValueAt).toHaveBeenCalledWith('CESANTIAS_PLAZO_MES', expect.any(Date), 'tenant-1');
    });

    it('status PROXIMA_A_VENCER cuando faltan <=15 días y hay pendientes', async (): Promise<void> => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(2);

      const result = await service.getAlertSummary('tenant-1');

      expect(result.status).toBe('PROXIMA_A_VENCER');
      expect(result.daysUntilDeadline).toBe(13);
    });

    it('status VENCIDA cuando ya pasó la fecha límite y aún hay pendientes', async (): Promise<void> => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(1);

      const result = await service.getAlertSummary('tenant-1');

      expect(result.status).toBe('VENCIDA');
    });

    it('status COMPLETADA cuando no hay pendientes, incluso si ya pasó la fecha límite', async (): Promise<void> => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(0);

      const result = await service.getAlertSummary('tenant-1');

      expect(result.status).toBe('COMPLETADA');
    });

    it('solo hay CONSIGNADA (nada CALCULADA) — pendingCount 0, se oculta (COMPLETADA)', async (): Promise<void> => {
      // countPendingByTenantAndYear solo cuenta cesantiasStatus=CALCULADA (ver
      // cesantias.repository.spec.ts) — si todo lo del año ya quedó CONSIGNADA, el
      // repositorio real devolvería 0 aquí; se simula ese resultado directamente.
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(0);

      const result = await service.getAlertSummary('tenant-1');

      expect(result.pendingCount).toBe(0);
      expect(result.status).toBe('COMPLETADA');
    });

    it('solo hay ANULADA (nada CALCULADA) — pendingCount 0, se oculta (COMPLETADA), no VENCIDA', async (): Promise<void> => {
      // Igual razonamiento que el caso anterior — ANULADA tampoco cuenta como pendiente.
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(0);

      const result = await service.getAlertSummary('tenant-1');

      expect(result.pendingCount).toBe(0);
      expect(result.status).toBe('COMPLETADA');
    });

    it('hay CALCULADA pendiente aunque los intereses ya estén PAGADO — sigue contando como pendiente', async (): Promise<void> => {
      // pendingCount depende únicamente de cesantiasStatus (ver el test dedicado en
      // cesantias.repository.spec.ts que confirma que el where no incluye
      // interestStatus) — esta liquidación simulada tiene intereses pagados y aun así
      // debe reportarse como pendiente de CONSIGNAR cesantías.
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
      countPendingByTenantAndYear.mockResolvedValue(1);

      const result = await service.getAlertSummary('tenant-1');

      expect(result.pendingCount).toBe(1);
      expect(result.status).not.toBe('COMPLETADA');
    });

    it('tenant isolation — nunca consulta pendientes de otro tenant', async (): Promise<void> => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));

      await service.getAlertSummary('tenant-a');

      expect(countPendingByTenantAndYear).toHaveBeenCalledWith('tenant-a', expect.any(Number));
      expect(countPendingByTenantAndYear).not.toHaveBeenCalledWith('tenant-b', expect.any(Number));
    });
  });

  describe('getExportAvailability', (): void => {
    it('fna es true solo si hay al menos una liquidación exportable del canal FNA', async (): Promise<void> => {
      countExportableByTenantYearAndChannel.mockImplementation(
        (_tenantId: string, _year: number, channel: string): Promise<number> =>
          Promise.resolve(channel === 'FNA' ? 3 : 0),
      );

      const result = await service.getExportAvailability('tenant-1', 2025);

      expect(result).toEqual({ fna: true, privateOperator: false });
    });

    it('privateOperator es true solo si hay al menos una liquidación exportable del canal privado', async (): Promise<void> => {
      countExportableByTenantYearAndChannel.mockImplementation(
        (_tenantId: string, _year: number, channel: string): Promise<number> =>
          Promise.resolve(channel === 'PRIVATE_OPERATOR' ? 1 : 0),
      );

      const result = await service.getExportAvailability('tenant-1', 2025);

      expect(result).toEqual({ fna: false, privateOperator: true });
    });

    it('ambos false cuando no hay liquidaciones exportables en ningún canal (p.ej. todas ANULADA)', async (): Promise<void> => {
      countExportableByTenantYearAndChannel.mockResolvedValue(0);

      const result = await service.getExportAvailability('tenant-1', 2025);

      expect(result).toEqual({ fna: false, privateOperator: false });
    });

    it('delega en countExportableByTenantYearAndChannel con tenantId+año+canal para ambos canales', async (): Promise<void> => {
      await service.getExportAvailability('tenant-1', 2025);

      expect(countExportableByTenantYearAndChannel).toHaveBeenCalledWith('tenant-1', 2025, 'FNA');
      expect(countExportableByTenantYearAndChannel).toHaveBeenCalledWith(
        'tenant-1',
        2025,
        'PRIVATE_OPERATOR',
      );
    });

    it('rechaza un año fuera de rango', async (): Promise<void> => {
      await expect(service.getExportAvailability('tenant-1', 1999)).rejects.toThrow('Año inválido');
      expect(countExportableByTenantYearAndChannel).not.toHaveBeenCalled();
    });
  });

  // OS-591 (fase 1) — consulta por empleado, sin batch, sin afectar otros empleados.
  describe('getEmployeeBalanceAsOf', (): void => {
    it('nunca invoca saveCalculations (no persiste, no afecta otros empleados)', async (): Promise<void> => {
      await service.getEmployeeBalanceAsOf('tenant-1', 'emp-1', new Date('2020-06-30'));

      expect(saveCalculations).not.toHaveBeenCalled();
      expect(findAllEmployees).not.toHaveBeenCalled();
    });

    it('excluye del pendiente un año anterior CONSIGNADA/PAGADO (anti-doble-pago)', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        {
          id: 'liq-2019',
          year: 2019,
          cesantiasStatus: 'CONSIGNADA',
          interestStatus: 'PAGADO',
          cesantiasAmount: '500000',
          interestAmount: '60000',
        },
      ]);

      const result = await service.getEmployeeBalanceAsOf(
        'tenant-1',
        'emp-1',
        new Date('2020-01-01'),
      );

      expect(result.pendingCesantias).not.toBe('500000');
      expect(result.sourceLiquidations).toHaveLength(1);
      expect(result.statesConsidered.excludedCesantiasStatuses).toContain('CONSIGNADA');
      expect(result.statesConsidered.excludedInterestStatuses).toContain('PAGADO');
    });

    it('suma un año anterior CALCULADA (aún pendiente) al saldo', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        {
          id: 'liq-2019',
          year: 2019,
          cesantiasStatus: 'CALCULADA',
          interestStatus: 'CALCULADO',
          cesantiasAmount: '500000',
          interestAmount: '60000',
        },
      ]);
      findByIdPayroll.mockResolvedValue(employee({ hireDate: new Date('2019-01-01') }));

      const result = await service.getEmployeeBalanceAsOf(
        'tenant-1',
        'emp-1',
        new Date('2020-01-01'),
      );

      // 500000 del año anterior pendiente + el tramo en vivo de 2020 (1 día, ~ínfimo)
      expect(Number(result.pendingCesantias)).toBeGreaterThanOrEqual(500000);
      expect(Number(result.pendingInterest)).toBeGreaterThanOrEqual(60000);
    });

    it('lanza NotFoundException si el empleado no existe o es de otro tenant', async (): Promise<void> => {
      findByIdPayroll.mockResolvedValue(null);

      await expect(
        service.getEmployeeBalanceAsOf('tenant-1', 'emp-x', new Date('2020-01-01')),
      ).rejects.toThrow(NotFoundException);
    });

    it('no proyecta tramo en vivo para contratos exentos (PRESTACION/APRENDIZAJE)', async (): Promise<void> => {
      findByIdPayroll.mockResolvedValue(
        employee({ contractType: EmployeeContractType.PRESTACION }),
      );

      const result = await service.getEmployeeBalanceAsOf(
        'tenant-1',
        'emp-1',
        new Date('2020-06-30'),
      );

      expect(result.pendingCesantias).toBe('0');
      expect(findSalaryHistoryByEmployee).not.toHaveBeenCalled();
    });

    it('consolida un cálculo CALCULADA ya persistido del año en curso sin recalcular el año completo (anti-doble-conteo)', async (): Promise<void> => {
      // Arrange — ya corrió un cálculo hasta el 30-jun (CALCULADA, no CONSIGNADA), y ahora
      // se consulta el saldo al 15-sep. El tramo en vivo debe cubrir SOLO 1-jul → 15-sep,
      // no todo el año desde enero (que sería sumar dos veces la porción ene-jun).
      findAllByEmployee.mockResolvedValue([
        {
          id: 'liq-2020',
          year: 2020,
          cesantiasStatus: 'CALCULADA',
          interestStatus: 'CALCULADO',
          cesantiasAmount: '500000',
          interestAmount: '10000',
          periodEnd: new Date('2020-06-30'),
        },
      ]);

      const result = await service.getEmployeeBalanceAsOf(
        'tenant-1',
        'emp-1',
        new Date('2020-09-15'),
      );

      // Assert — 500000 (persistido) + 520833.33 (tramo 1-jul→15-sep: 75 días comerciales
      // × 2500000/360). Si el código recalculara todo el año desde enero, el resultado
      // sería ~1.77M en vez de ~1.02M — la aserción exacta descarta ambas formas de bug
      // (ignorar lo persistido Y duplicar el tramo ya cubierto).
      expect(result.pendingCesantias).toBe('1020833.33');
      expect(result.currentPeriodStart).toEqual(new Date(Date.UTC(2020, 6, 1)));
    });

    it('descarta el monto de un año en curso ANULADA y recalcula limpio desde enero', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        {
          id: 'liq-2020',
          year: 2020,
          cesantiasStatus: 'ANULADA',
          interestStatus: 'ANULADO',
          cesantiasAmount: '999999999', // valor absurdo — no debe aparecer en el resultado
          interestAmount: '999999999',
          periodEnd: new Date('2020-06-30'),
        },
      ]);

      const result = await service.getEmployeeBalanceAsOf(
        'tenant-1',
        'emp-1',
        new Date('2020-01-31'),
      );

      // Assert — recalculado desde el 1-ene (31 días), no debe incluir el monto anulado.
      expect(Number(result.pendingCesantias)).toBeLessThan(300000);
    });
  });
});
