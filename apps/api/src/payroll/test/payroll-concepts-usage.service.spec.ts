import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PayrollConceptsService } from '../service/payroll-concepts.service';
import { PayrollConceptsUsageService } from '../service/payroll-concepts-usage.service';

describe('PayrollConceptsUsageService (OS-612 Fase 5)', (): void => {
  let service: PayrollConceptsUsageService;
  let groupBy: jest.Mock;
  let findMany: jest.Mock;
  let classifyLineSnapshot: jest.Mock;

  beforeEach(async (): Promise<void> => {
    groupBy = jest.fn();
    findMany = jest.fn();
    classifyLineSnapshot = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollConceptsUsageService,
        {
          provide: PrismaService,
          useValue: {
            settlementLine: { groupBy, findMany },
          },
        },
        {
          provide: PayrollConceptsService,
          useValue: { classifyLineSnapshot },
        },
      ],
    }).compile();

    service = module.get(PayrollConceptsUsageService);
  });

  it('agrega distinct code/name, estados y cobertura OS-380 estática', async (): Promise<void> => {
    groupBy.mockResolvedValue([
      { code: 'CESANTIAS', name: 'Cesantías (saldo pendiente)', _count: { _all: 2 } },
      { code: 'FOO_LIBRE', name: 'Libre', _count: { _all: 1 } },
    ]);
    classifyLineSnapshot
      .mockResolvedValueOnce({
        status: 'CATALOGED',
        catalogDisplayName: 'Cesantías (saldo pendiente)',
      })
      .mockResolvedValueOnce({ status: 'UNCATALOGED', catalogDisplayName: null });
    findMany.mockResolvedValue([
      {
        id: 'line-1',
        settlementId: 'set-1',
        settlement: { status: 'CALCULATED' },
      },
    ]);

    const report = await service.getUsageReport('tenant-a');

    expect(groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['code', 'name'],
        where: { tenantId: 'tenant-a' },
      }),
    );
    expect(report.summary).toEqual({
      distinctPairs: 2,
      cataloged: 1,
      uncataloged: 1,
      inactive: 0,
      nameMismatch: 0,
    });
    expect(report.os380FieldCoverage.mappedFieldCount).toBe(15);
    expect(report.os380FieldCoverage.note).toContain('no persiste líneas mensuales');
    expect(report.settlementLineUsages[0].examples[0].settlementId).toBe('set-1');
  });
});
