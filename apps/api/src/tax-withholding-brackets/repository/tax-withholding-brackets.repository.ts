import { Injectable } from '@nestjs/common';
import type { Prisma, TaxWithholdingBracket } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { ITaxWithholdingBracketsRepository } from '../interfaces/tax-withholding-brackets.interfaces';

@Injectable()
export class TaxWithholdingBracketsRepository implements ITaxWithholdingBracketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRowsForRange(
    tenantScopes: string[],
    from: Date,
    to: Date | null,
  ): Promise<TaxWithholdingBracket[]> {
    const where: Prisma.TaxWithholdingBracketWhereInput = {
      tenantScope: { in: tenantScopes },
      deletedAt: null,
      OR: [{ validTo: null }, { validTo: { gte: from } }],
    };
    if (to) {
      where.validFrom = { lte: to };
    }
    return this.prisma.taxWithholdingBracket.findMany({
      where,
      orderBy: [{ validFrom: 'asc' }, { sortOrder: 'asc' }],
    });
  }
}
