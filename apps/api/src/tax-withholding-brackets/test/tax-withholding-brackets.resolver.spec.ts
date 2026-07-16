import { Test, type TestingModule } from '@nestjs/testing';

import { TaxWithholdingBracketsResolver } from '../resolver/tax-withholding-brackets.resolver';

describe('TaxWithholdingBracketsResolver', (): void => {
  let resolver: TaxWithholdingBracketsResolver;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxWithholdingBracketsResolver],
    }).compile();

    resolver = module.get(TaxWithholdingBracketsResolver);
  });

  it('is defined', (): void => {
    expect(resolver).toBeDefined();
  });
});
