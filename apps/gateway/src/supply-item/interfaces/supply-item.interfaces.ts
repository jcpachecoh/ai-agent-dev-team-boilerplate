import { SupplyItem } from '@prisma/client';

export interface FindSupplyItemsOptions {
  search?: string | null;
  limit?: number | null;
}

export interface ISupplyItemRepository {
  findAll(tenantId: string, opts: FindSupplyItemsOptions): Promise<SupplyItem[]>;
}

export interface ISupplyItemService {
  findAll(tenantId: string, opts: FindSupplyItemsOptions): Promise<SupplyItem[]>;
}
