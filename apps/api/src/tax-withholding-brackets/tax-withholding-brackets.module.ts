import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { TaxWithholdingBracketsRepository } from './repository/tax-withholding-brackets.repository';
import { TaxWithholdingBracketsResolver } from './resolver/tax-withholding-brackets.resolver';
import { TaxWithholdingBracketsService } from './service/tax-withholding-brackets.service';

@Module({
  imports: [PrismaModule],
  providers: [
    TaxWithholdingBracketsService,
    TaxWithholdingBracketsRepository,
    TaxWithholdingBracketsResolver,
  ],
  exports: [TaxWithholdingBracketsService],
})
export class TaxWithholdingBracketsModule {}
