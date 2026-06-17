import type { SupplyItem } from '@prisma/client';

export interface ISupplyitemsRepository {
  findOne(tenantId: string, id: string): Promise<SupplyItem | null>;
  findAll(tenantId: string, options?: FindSupplyItemsOptions): Promise<SupplyItem[]>;
}

export interface ISupplyitemsService {
  findOne(tenantId: string, id: string): Promise<SupplyItem>;
  findAll(tenantId: string, options?: FindSupplyItemsOptions): Promise<SupplyItem[]>;
}

export interface FindSupplyItemsOptions {
  search?: string;
  limit?: number;
}
