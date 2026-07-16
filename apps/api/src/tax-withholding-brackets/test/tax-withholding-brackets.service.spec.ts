import { Test, type TestingModule } from '@nestjs/testing';
import type { TaxWithholdingBracket } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { GLOBAL_TENANT_SCOPE } from '../../labor-legal-parameters/labor-legal-parameters.constants';
import { TaxWithholdingBracketsRepository } from '../repository/tax-withholding-brackets.repository';
import { TaxWithholdingBracketsService } from '../service/tax-withholding-brackets.service';
import {
  OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277,
  PROVISIONAL_TAX_WITHHOLDING_VALID_FROM,
} from '../tax-withholding-brackets.constants';

const TENANT_ID = 'tenant-001';
const VALID_FROM = new Date(`${PROVISIONAL_TAX_WITHHOLDING_VALID_FROM}T00:00:00.000Z`);

function makeDbRows(): TaxWithholdingBracket[] {
  return OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277.map(
    (bracket): TaxWithholdingBracket => ({
      id: `bracket-${bracket.sortOrder}`,
      tenantId: null,
      tenantScope: GLOBAL_TENANT_SCOPE,
      sortOrder: bracket.sortOrder,
      lowerUvtBound: new Decimal(bracket.lowerUvtBound),
      upperUvtBound: bracket.upperUvtBound === null ? null : new Decimal(bracket.upperUvtBound),
      marginalRate: new Decimal(bracket.marginalRate),
      fixedTaxUvt: new Decimal(bracket.fixedTaxUvt),
      validFrom: VALID_FROM,
      validTo: null,
      source: 'test',
      deletedAt: null,
      createdAt: VALID_FROM,
      updatedAt: VALID_FROM,
    }),
  );
}

describe('TaxWithholdingBracketsService', (): void => {
  let service: TaxWithholdingBracketsService;
  let repository: jest.Mocked<TaxWithholdingBracketsRepository>;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxWithholdingBracketsService,
        {
          provide: TaxWithholdingBracketsRepository,
          useValue: {
            findRowsForRange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TaxWithholdingBracketsService);
    repository = module.get(TaxWithholdingBracketsRepository);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('preload queries tenant + global scopes and returns snapshot with 7 brackets', async (): Promise<void> => {
    const from = new Date('2025-06-01T00:00:00.000Z');
    const to = new Date('2025-06-30T23:59:59.999Z');
    repository.findRowsForRange.mockResolvedValue(makeDbRows());

    const snapshot = await service.preload(from, to, TENANT_ID);
    const brackets = snapshot.bracketsAt(to);

    expect(repository.findRowsForRange.mock.calls[0]).toEqual([
      [TENANT_ID, GLOBAL_TENANT_SCOPE],
      from,
      to,
    ]);
    expect(brackets).toHaveLength(7);
  });

  it('preload uses only global scope when tenantId is omitted', async (): Promise<void> => {
    const from = new Date('2025-06-01T00:00:00.000Z');
    const to = new Date('2025-06-30T23:59:59.999Z');
    repository.findRowsForRange.mockResolvedValue(makeDbRows());

    await service.preload(from, to);

    expect(repository.findRowsForRange.mock.calls[0]).toEqual([[GLOBAL_TENANT_SCOPE], from, to]);
  });

  it('can be constructed directly with repository dependency', (): void => {
    const directService = new TaxWithholdingBracketsService(repository);
    expect(directService).toBeInstanceOf(TaxWithholdingBracketsService);
  });
});
