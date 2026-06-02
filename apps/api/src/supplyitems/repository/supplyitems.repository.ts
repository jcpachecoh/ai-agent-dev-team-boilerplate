import { Injectable } from '@nestjs/common';
import type { SupplyItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ISupplyitemsRepository } from '../interfaces/supplyitems.interfaces';

@Injectable()
export class SupplyItemsRepository implements ISupplyitemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(tenantId: string, id: string): Promise<SupplyItem | null> {
    return this.prisma.supplyItem.findFirst({
      where: { id, tenantId },
    });
  }
}
