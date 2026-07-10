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
  let findSalaryHistoryByEmployees: jest.Mock;
  let findFundHistoryByEmployees: jest.Mock;
  let findMapByTenantAndYear: jest.Mock;
  let saveCalculations: jest.Mock;
  let preload: jest.Mock;
  let findByTenantAndYear: jest.Mock;
  let countByTenantAndYear: jest.Mock;
  let findById: jest.Mock;

  beforeEach((): void => {
    findAllEmployees = jest.fn().mockResolvedValue([employee()]);
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

    const payrollRepository = { findAll: findAllEmployees } as unknown as PayrollRepository;
    const employeeHistoryRepository = {
      findSalaryHistoryByEmployees,
      findFundHistoryByEmployees,
    } as unknown as EmployeeHistoryRepository;
    const cesantiasRepository = {
      findMapByTenantAndYear,
      saveCalculations,
      findByTenantAndYear,
      countByTenantAndYear,
      findById,
    } as unknown as CesantiasRepository;
    const legalParametersService = { preload } as unknown as LaborLegalParametersService;

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
});
