import { Injectable } from '@nestjs/common';
import type {
  IPurchaseOrderRepository,
  PurchaseOrder,
} from '../interfaces/purchase-order.interfaces';

@Injectable()
export class PurchaseOrderRepository implements IPurchaseOrderRepository {
  async findAll(_tenantId: string): Promise<PurchaseOrder[]> {
    return [];
  }

  async findById(_id: string, _tenantId: string): Promise<PurchaseOrder | null> {
    return null;
  }
}
