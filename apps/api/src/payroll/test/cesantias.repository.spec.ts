import { Prisma } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import type { UpsertCesantiasLiquidationData } from '../interfaces/cesantias.interfaces';
import { CesantiasRepository } from '../repository/cesantias.repository';

function baseRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'liq-1',
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    year: 2026,
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    accrualDays: 360,
    calculationBase: new Prisma.Decimal(2500000),
    cesantiasAmount: new Prisma.Decimal(2500000),
    interestAmount: new Prisma.Decimal(300000),
    interestRateSnapshot: new Prisma.Decimal(0.12),
    fundNameSnapshot: 'Porvenir',
    fundChannelSnapshot: 'PRIVATE_OPERATOR',
    cesantiasStatus: 'CALCULADA',
    interestStatus: 'CALCULADO',
    calculatedBy: 'user-1',
    calculatedAt: new Date('2026-07-10'),
    createdAt: new Date('2026-07-10'),
    updatedAt: new Date('2026-07-10'),
    ...overrides,
  };
}

function upsertData(
  overrides: Partial<UpsertCesantiasLiquidationData> = {},
): UpsertCesantiasLiquidationData {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    year: 2026,
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    accrualDays: 360,
    calculationBase: new Prisma.Decimal(2500000),
    cesantiasAmount: new Prisma.Decimal(2500000),
    interestAmount: new Prisma.Decimal(300000),
    interestRateSnapshot: new Prisma.Decimal(0.12),
    fundNameSnapshot: 'Porvenir',
    fundChannelSnapshot: 'PRIVATE_OPERATOR',
    calculatedBy: 'user-1',
    ...overrides,
  };
}

describe('CesantiasRepository', (): void => {
  let repository: CesantiasRepository;
  let findFirst: jest.Mock;
  let findMany: jest.Mock;
  let count: jest.Mock;
  let upsert: jest.Mock;
  let transaction: jest.Mock;
  let prisma: PrismaService;

  beforeEach((): void => {
    findFirst = jest.fn();
    findMany = jest.fn();
    count = jest.fn();
    upsert = jest.fn();
    transaction = jest.fn();

    prisma = {
      cesantiasLiquidation: { findFirst, findMany, count, upsert },
      $transaction: transaction,
    } as unknown as PrismaService;

    repository = new CesantiasRepository(prisma);
  });

  it('findByEmployeeAndYear scopes by tenantId, employeeId and year', async (): Promise<void> => {
    findFirst.mockResolvedValue(null);

    await repository.findByEmployeeAndYear('tenant-1', 'emp-1', 2026);

    expect(findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1', year: 2026 },
    });
  });

  it('findMapByTenantAndYear indexes results by employeeId', async (): Promise<void> => {
    findMany.mockResolvedValue([
      baseRow({ employeeId: 'emp-1' }),
      baseRow({ employeeId: 'emp-2' }),
    ]);

    const map = await repository.findMapByTenantAndYear('tenant-1', 2026);

    expect(findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1', year: 2026 } });
    expect([...map.keys()]).toEqual(['emp-1', 'emp-2']);
  });

  it('saveCalculations wraps every upsert in a single transaction', async (): Promise<void> => {
    transaction.mockImplementation((callback: (tx: unknown) => unknown): unknown => {
      const tx = { cesantiasLiquidation: { upsert } };
      upsert.mockResolvedValue(baseRow());
      return callback(tx);
    });

    const items = [upsertData({ employeeId: 'emp-1' }), upsertData({ employeeId: 'emp-2' })];
    const result = await repository.saveCalculations(items);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('saveCalculations returns an empty array without opening a transaction when there is nothing to write', async (): Promise<void> => {
    const result = await repository.saveCalculations([]);

    expect(result).toEqual([]);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('saveCalculations propagates a mid-batch failure instead of swallowing it (garantía de rollback)', async (): Promise<void> => {
    const dbError = new Error('unique constraint violated');
    transaction.mockImplementation((callback: (tx: unknown) => unknown): unknown => {
      const failingUpsert = jest
        .fn()
        .mockResolvedValueOnce(baseRow({ employeeId: 'emp-1' }))
        .mockRejectedValueOnce(dbError);
      const tx = { cesantiasLiquidation: { upsert: failingUpsert } };
      return callback(tx);
    });

    await expect(
      repository.saveCalculations([
        upsertData({ employeeId: 'emp-1' }),
        upsertData({ employeeId: 'emp-2' }),
      ]),
    ).rejects.toThrow(dbError);
  });

  it('upsertCalculationTx resets status to CALCULADA/CALCULADO on update (recálculo)', async (): Promise<void> => {
    upsert.mockResolvedValue(baseRow());
    const tx = { cesantiasLiquidation: { upsert } } as unknown as Prisma.TransactionClient;

    await repository.upsertCalculationTx(tx, upsertData());

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeId_year: { employeeId: 'emp-1', year: 2026 } },
        update: expect.objectContaining({
          cesantiasStatus: 'CALCULADA',
          interestStatus: 'CALCULADO',
        }),
      }),
    );
  });

  it('findByTenantAndYear applies year/status filters and pagination defaults', async (): Promise<void> => {
    findMany.mockResolvedValue([]);

    await repository.findByTenantAndYear({
      tenantId: 'tenant-1',
      year: 2026,
      cesantiasStatus: 'CONSIGNADA',
    });

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', year: 2026, cesantiasStatus: 'CONSIGNADA' },
      orderBy: { employeeId: 'asc' },
      take: 50,
      skip: 0,
    });
  });

  it('countByTenantAndYear applies the same filters as findByTenantAndYear', async (): Promise<void> => {
    count.mockResolvedValue(7);

    const result = await repository.countByTenantAndYear({
      tenantId: 'tenant-1',
      year: 2026,
      interestStatus: 'PAGADO',
    });

    expect(count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', year: 2026, interestStatus: 'PAGADO' },
    });
    expect(result).toBe(7);
  });

  it('findExportableByTenantAndYear scopes by tenant+year and only CALCULADA/CONSIGNADA', async (): Promise<void> => {
    findMany.mockResolvedValue([]);

    await repository.findExportableByTenantAndYear('tenant-1', 2026);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        year: 2026,
        cesantiasStatus: { in: ['CALCULADA', 'CONSIGNADA'] },
      },
      orderBy: { employeeId: 'asc' },
    });
  });

  it('findById scopes by tenantId', async (): Promise<void> => {
    findFirst.mockResolvedValue(null);

    await repository.findById('tenant-1', 'liq-1');

    expect(findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1', id: 'liq-1' } });
  });
});
