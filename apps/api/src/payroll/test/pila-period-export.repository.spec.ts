import { PilaExportFormat, PilaPeriodExportStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PilaPeriodExportRepository } from '../pila/pila-period-export.repository';

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/explicit-function-return-type */

describe('PilaPeriodExportRepository', () => {
  let repository: PilaPeriodExportRepository;
  let prisma: {
    pilaPeriodExport: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    storageObject: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  const tenantId = 't1';
  const period = '2026-07';

  beforeEach(async () => {
    prisma = {
      pilaPeriodExport: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      storageObject: { update: jest.fn() },
      $transaction: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [PilaPeriodExportRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get(PilaPeriodExportRepository);
  });

  it('findMaxVersion retorna 0 si no hay filas', async () => {
    prisma.pilaPeriodExport.findFirst.mockResolvedValue(null);
    await expect(repository.findMaxVersion(tenantId, period, PilaExportFormat.TXT)).resolves.toBe(
      0,
    );
  });

  it('findMaxVersion retorna versión existente por formato', async () => {
    prisma.pilaPeriodExport.findFirst.mockResolvedValue({ version: 3 });
    await expect(repository.findMaxVersion(tenantId, period, PilaExportFormat.XLSX)).resolves.toBe(
      3,
    );
    expect(prisma.pilaPeriodExport.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, periodHealth: period, format: PilaExportFormat.XLSX },
      }),
    );
  });

  it('list aplica filtros opcionales period/status/format', async () => {
    prisma.pilaPeriodExport.findMany.mockResolvedValue([]);
    await repository.list(tenantId, {
      periodHealth: period,
      status: PilaPeriodExportStatus.GENERATED,
      format: PilaExportFormat.TXT,
    });
    expect(prisma.pilaPeriodExport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          periodHealth: period,
          status: PilaPeriodExportStatus.GENERATED,
          format: PilaExportFormat.TXT,
        },
      }),
    );

    await repository.list(tenantId, {});
    expect(prisma.pilaPeriodExport.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { tenantId } }),
    );
  });

  it('markPaidForPeriod actualiza GENERATED del período y relista activos', async () => {
    prisma.pilaPeriodExport.updateMany.mockResolvedValue({ count: 2 });
    prisma.pilaPeriodExport.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    const rows = await repository.markPaidForPeriod(tenantId, period, {
      paidAt: new Date('2026-07-16T00:00:00.000Z'),
      paidConfirmedBy: 'u1',
      planNumber: 'PL-1',
      paymentReference: null,
    });
    expect(prisma.pilaPeriodExport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          periodHealth: period,
          status: PilaPeriodExportStatus.GENERATED,
        },
      }),
    );
    expect(rows).toHaveLength(2);
  });

  it('voidActiveAndCreate anula activo cuando hay id+meta', async () => {
    const created = { id: 'new' };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn({
        pilaPeriodExport: {
          update: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue(created),
        },
      } as unknown as typeof prisma),
    );
    const result = await repository.voidActiveAndCreate(
      'old',
      { voidedAt: new Date(), voidedBy: 'u1', voidReason: 'REGENERATED' },
      { tenantId, periodHealth: period } as never,
    );
    expect(result).toEqual(created);
  });

  it('voidActiveAndCreate solo crea cuando no hay activo', async () => {
    const created = { id: 'new' };
    const update = jest.fn();
    const create = jest.fn().mockResolvedValue(created);
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ pilaPeriodExport: { update, create } }),
    );
    await repository.voidActiveAndCreate(null, null, { tenantId } as never);
    expect(update).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });

  it('updateStorageEntityId enlaza StorageObject', async () => {
    prisma.storageObject.update.mockResolvedValue({});
    await repository.updateStorageEntityId('sto-1', 'exp-1');
    expect(prisma.storageObject.update).toHaveBeenCalledWith({
      where: { id: 'sto-1' },
      data: { entityType: 'PilaPeriodExport', entityId: 'exp-1' },
    });
  });

  it('findActive / payment evidence / markPaid / markVoided / create / findById', async () => {
    prisma.pilaPeriodExport.findFirst.mockResolvedValue({ id: '1' });
    prisma.pilaPeriodExport.findMany.mockResolvedValue([{ id: '1' }]);
    prisma.pilaPeriodExport.create.mockResolvedValue({ id: '1' });
    prisma.pilaPeriodExport.update.mockResolvedValue({ id: '1' });

    await repository.findActiveByPeriod(tenantId, period, PilaExportFormat.TXT);
    await repository.findActiveByPeriodAnyFormat(tenantId, period);
    await repository.findWithPaymentEvidence(tenantId, period);
    await repository.findById('1', tenantId);
    await repository.create({ tenantId } as never);
    await repository.markPaid('1', tenantId, {
      paidAt: new Date(),
      paidConfirmedBy: 'u',
      planNumber: 'P',
      paymentReference: 'R',
    });
    await repository.markVoided('1', tenantId, {
      voidedAt: new Date(),
      voidedBy: 'u',
      voidReason: 'x',
    });
    expect(prisma.pilaPeriodExport.update).toHaveBeenCalled();
  });
});
