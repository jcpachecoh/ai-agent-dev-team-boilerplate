import { Prisma, SupplyItem } from '@prisma/client';
import { BaseService } from './base.service';

export class SupplyItemService extends BaseService {
  /**
   * List supply items for combobox search, scoped to tenant.
   */
  async findAll(
    tenantId: string,
    opts: { search?: string | null; limit?: number | null } = {},
  ): Promise<SupplyItem[]> {
    const take = Math.min(Math.max(1, opts.limit ?? 50), 100);

    const where: Prisma.SupplyItemWhereInput = {
      tenantId,
      isActive: true,
      ...(opts.search
        ? {
            OR: [
              { nombre: { contains: opts.search, mode: 'insensitive' } },
              { codigoInterno: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.supplyItem.findMany({
      where,
      take,
      orderBy: { nombre: 'asc' },
    });
  }
}
