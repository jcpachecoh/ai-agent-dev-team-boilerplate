import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplyItem, Prisma } from '@prisma/client';
import type {
  ISupplyItemRepository,
  FindSupplyItemsOptions,
} from '../interfaces/supply-item.interfaces';

@Injectable()
export class SupplyItemRepository implements ISupplyItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, opts: FindSupplyItemsOptions): Promise<SupplyItem[]> {
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

    return this.prisma.supplyItem.findMany({ where, take, orderBy: { nombre: 'asc' } });
  }
}
