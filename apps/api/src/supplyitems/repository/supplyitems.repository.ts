import { Injectable } from '@nestjs/common';
import type { SupplyItem } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ISupplyitemsRepository,
  FindSupplyItemsOptions,
} from '../interfaces/supplyitems.interfaces';

@Injectable()
export class SupplyItemsRepository implements ISupplyitemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(tenantId: string, id: string): Promise<SupplyItem | null> {
    return this.prisma.supplyItem.findFirst({
      where: { id, tenantId },
    });
  }

  findAll(tenantId: string, options: FindSupplyItemsOptions = {}): Promise<SupplyItem[]> {
    const take = Math.min(Math.max(1, options.limit ?? 50), 100);

    const where: Prisma.SupplyItemWhereInput = {
      tenantId,
      isActive: true,
      ...(options.search
        ? {
            OR: [
              { nombre: { contains: options.search, mode: 'insensitive' } },
              { codigoInterno: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.supplyItem.findMany({ where, take, orderBy: { nombre: 'asc' } });
  }
}
