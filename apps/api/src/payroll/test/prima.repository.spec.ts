import { Prisma } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import type { UpsertPrimaLiquidationData } from '../interfaces/prima.interfaces';
import { PrimaRepository } from '../repository/prima.repository';

function baseRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'prima-1',
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    year: 2026,
    half: 'PRIMER_SEMESTRE',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-06-30'),
    accrualDays: 180,
    calculationBase: new Prisma.Decimal(1750905),
    accruedAmount: new Prisma.Decimal(1750905),
    paidAmount: new Prisma.Decimal(0),
    divisorSnapshot: new Prisma.Decimal(180),
    status: 'CALCULADA',
    calculatedBy: 'user-1',
    calculatedAt: new Date('2026-06-30'),
    createdAt: new Date('2026-06-30'),
    updatedAt: new Date('2026-06-30'),
    ...overrides,
  };
}

function upsertData(
  overrides: Partial<UpsertPrimaLiquidationData> = {},
): UpsertPrimaLiquidationData {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    year: 2026,
    half: 'PRIMER_SEMESTRE',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-06-30'),
    accrualDays: 180,
    calculationBase: new Prisma.Decimal(1750905),
    accruedAmount: new Prisma.Decimal(1750905),
    divisorSnapshot: new Prisma.Decimal(180),
    calculatedBy: 'user-1',
    ...overrides,
  };
}

describe('PrimaRepository', (): void => {
  let repository: PrimaRepository;
  let findFirst: jest.Mock;
  let findMany: jest.Mock;
  let upsert: jest.Mock;
  let update: jest.Mock;
  let prisma: PrismaService;

  beforeEach((): void => {
    findFirst = jest.fn();
    findMany = jest.fn();
    upsert = jest.fn();
    update = jest.fn();

    prisma = {
      primaLiquidation: { findFirst, findMany, upsert, update },
    } as unknown as PrismaService;

    repository = new PrimaRepository(prisma);
  });

  const tx = (): Prisma.TransactionClient =>
    ({
      primaLiquidation: { findFirst, findMany, upsert, update },
    }) as unknown as Prisma.TransactionClient;

  describe('findByEmployeeAndPeriod', (): void => {
    it('consulta por tenant+empleado+año+semestre y mapea el resultado', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      const result = await repository.findByEmployeeAndPeriod(
        'tenant-1',
        'emp-1',
        2026,
        'PRIMER_SEMESTRE',
      );

      expect(findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', employeeId: 'emp-1', year: 2026, half: 'PRIMER_SEMESTRE' },
      });
      expect(result?.accruedAmount).toBe('1750905');
    });

    it('devuelve null si no existe', async (): Promise<void> => {
      findFirst.mockResolvedValue(null);

      const result = await repository.findByEmployeeAndPeriod(
        'tenant-1',
        'emp-1',
        2026,
        'PRIMER_SEMESTRE',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAllByEmployee', (): void => {
    it('trae todas las liquidaciones de un empleado ordenadas por año/semestre', async (): Promise<void> => {
      findMany.mockResolvedValue([baseRow(), baseRow({ id: 'prima-2', year: 2025 })]);

      const result = await repository.findAllByEmployee('tenant-1', 'emp-1');

      expect(findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
        orderBy: [{ year: 'asc' }, { half: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', (): void => {
    it('consulta por tenant+id', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      await repository.findById('tenant-1', 'prima-1');

      expect(findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1', id: 'prima-1' } });
    });
  });

  describe('upsertCalculationTx', (): void => {
    it('resetea a CALCULADA en cada recálculo (update)', async (): Promise<void> => {
      upsert.mockResolvedValue(baseRow());

      await repository.upsertCalculationTx(tx(), upsertData());

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employeeId_year_half: { employeeId: 'emp-1', year: 2026, half: 'PRIMER_SEMESTRE' },
          },
          update: expect.objectContaining({ status: 'CALCULADA' }),
          create: expect.objectContaining({ tenantId: 'tenant-1', employeeId: 'emp-1' }),
        }),
      );
    });
  });

  describe('registerPaymentTx', (): void => {
    it('incrementa paidAmount y persiste el status que decide el caller', async (): Promise<void> => {
      update.mockResolvedValue(
        baseRow({ paidAmount: new Prisma.Decimal(450000), status: 'PAGADA' }),
      );

      const result = await repository.registerPaymentTx(
        tx(),
        'prima-1',
        new Prisma.Decimal(450000),
        'PAGADA',
      );

      expect(update).toHaveBeenCalledWith({
        where: { id: 'prima-1' },
        data: { paidAmount: { increment: new Prisma.Decimal(450000) }, status: 'PAGADA' },
      });
      expect(result.status).toBe('PAGADA');
    });

    it('no fuerza PAGADA — respeta CALCULADA cuando el caller decide que el pago fue parcial', async (): Promise<void> => {
      update.mockResolvedValue(
        baseRow({ paidAmount: new Prisma.Decimal(450000), status: 'CALCULADA' }),
      );

      await repository.registerPaymentTx(tx(), 'prima-1', new Prisma.Decimal(450000), 'CALCULADA');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'prima-1' },
        data: { paidAmount: { increment: new Prisma.Decimal(450000) }, status: 'CALCULADA' },
      });
    });
  });

  describe('annulTx', (): void => {
    it('marca la liquidación como ANULADA', async (): Promise<void> => {
      update.mockResolvedValue(baseRow({ status: 'ANULADA' }));

      const result = await repository.annulTx(tx(), 'prima-1');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'prima-1' },
        data: { status: 'ANULADA' },
      });
      expect(result.status).toBe('ANULADA');
    });
  });
});
