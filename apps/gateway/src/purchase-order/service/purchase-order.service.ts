import { Injectable, NotImplementedException } from '@nestjs/common';
import { PurchaseOrderRepository } from '../repository/purchase-order.repository';
import type { IPurchaseOrderService, PurchaseOrder } from '../interfaces/purchase-order.interfaces';

@Injectable()
export class PurchaseOrderService implements IPurchaseOrderService {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async findAll(tenantId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findAll(tenantId);
  }

  async findById(id: string, tenantId: string): Promise<PurchaseOrder | null> {
    return this.purchaseOrderRepository.findById(id, tenantId);
  }

  async create(_tenantId: string, _data: unknown): Promise<never> {
    throw new NotImplementedException('Purchase order creation is not yet implemented');
  }
}
