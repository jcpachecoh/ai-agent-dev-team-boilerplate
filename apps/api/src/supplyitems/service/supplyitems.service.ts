import { Injectable, NotFoundException } from '@nestjs/common';
import type { SupplyItem } from '@prisma/client';
import type {
  ISupplyitemsService,
  FindSupplyItemsOptions,
} from '../interfaces/supplyitems.interfaces';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';

@Injectable()
export class SupplyItemsService implements ISupplyitemsService {
  constructor(private readonly supplyItemsRepository: SupplyItemsRepository) {}

  async findOne(tenantId: string, id: string): Promise<SupplyItem> {
    const item = await this.supplyItemsRepository.findOne(tenantId, id);
    if (!item) {
      throw new NotFoundException(`SupplyItem ${id} not found`);
    }
    return item;
  }

  async findAll(tenantId: string, options: FindSupplyItemsOptions = {}): Promise<SupplyItem[]> {
    return this.supplyItemsRepository.findAll(tenantId, options);
  }
}
