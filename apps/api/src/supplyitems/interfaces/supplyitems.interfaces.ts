import type { SupplyItem } from '@prisma/client';

export interface ISupplyitemsRepository {
  findOne(tenantId: string, id: string): Promise<SupplyItem | null>;
}

export interface ISupplyitemsService {
  findOne(tenantId: string, id: string): Promise<SupplyItem>;
}
