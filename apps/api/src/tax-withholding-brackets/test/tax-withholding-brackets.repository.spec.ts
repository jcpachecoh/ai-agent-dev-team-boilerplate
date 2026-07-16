import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { GLOBAL_TENANT_SCOPE } from '../../labor-legal-parameters/labor-legal-parameters.constants';
import { TaxWithholdingBracketsRepository } from '../repository/tax-withholding-brackets.repository';

describe('TaxWithholdingBracketsRepository', (): void => {
  let repository: TaxWithholdingBracketsRepository;
  let mockFindMany: jest.Mock;

  beforeEach(async (): Promise<void> => {
    mockFindMany = jest.fn().mockResolvedValue([]);

    const prisma = {
      taxWithholdingBracket: {
        findMany: mockFindMany,
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxWithholdingBracketsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(TaxWithholdingBracketsRepository);
  });

  it('findRowsForRange applies validFrom lte when to is provided', async (): Promise<void> => {
    const from = new Date('2025-06-01T00:00:00.000Z');
    const to = new Date('2025-06-30T23:59:59.999Z');

    await repository.findRowsForRange([GLOBAL_TENANT_SCOPE], from, to);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        tenantScope: { in: [GLOBAL_TENANT_SCOPE] },
        deletedAt: null,
        OR: [{ validTo: null }, { validTo: { gte: from } }],
        validFrom: { lte: to },
      },
      orderBy: [{ validFrom: 'asc' }, { sortOrder: 'asc' }],
    });
  });

  it('findRowsForRange omits validFrom filter when to is null', async (): Promise<void> => {
    const from = new Date('2025-06-01T00:00:00.000Z');

    await repository.findRowsForRange([GLOBAL_TENANT_SCOPE], from, null);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        tenantScope: { in: [GLOBAL_TENANT_SCOPE] },
        deletedAt: null,
        OR: [{ validTo: null }, { validTo: { gte: from } }],
      },
      orderBy: [{ validFrom: 'asc' }, { sortOrder: 'asc' }],
    });
  });

  it('can be constructed directly with PrismaService', (): void => {
    const repo = new TaxWithholdingBracketsRepository({} as PrismaService);
    expect(repo).toBeInstanceOf(TaxWithholdingBracketsRepository);
  });
});
