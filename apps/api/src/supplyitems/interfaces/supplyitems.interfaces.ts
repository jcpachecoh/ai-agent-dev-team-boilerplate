import type { SupplyItem } from '@prisma/client';

export interface ISupplyItemsRepository {
  findOne(tenantId: string, id: string): Promise<SupplyItem | null>;
}

export interface ISupplyItemsService {
  findOne(tenantId: string, id: string): Promise<SupplyItem>;
}
