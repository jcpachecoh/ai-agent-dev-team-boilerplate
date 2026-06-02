import { Injectable } from '@nestjs/common';
import { SupplyItem } from '@prisma/client';
import { SupplyItemRepository } from '../repository/supply-item.repository';
import type {
  ISupplyItemService,
  FindSupplyItemsOptions,
} from '../interfaces/supply-item.interfaces';

@Injectable()
export class SupplyItemService implements ISupplyItemService {
  constructor(private readonly supplyItemRepository: SupplyItemRepository) {}

  async findAll(tenantId: string, opts: FindSupplyItemsOptions = {}): Promise<SupplyItem[]> {
    return this.supplyItemRepository.findAll(tenantId, opts);
  }
}
