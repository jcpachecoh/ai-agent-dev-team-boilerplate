import { BaseService } from './base.service';
import { createChildLogger } from '../utils/logging';

const log = createChildLogger('purchase-order.service');

export interface PurchaseOrderSummary {
  id: string;
  tenantId: string;
  supplierId: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}

/**
 * PurchaseOrderService — stub awaiting the PurchaseOrder Prisma model migration.
 */
export class PurchaseOrderService extends BaseService {
  async findAll(tenantId: string): Promise<PurchaseOrderSummary[]> {
    log.warn({ tenantId }, 'PurchaseOrderService.findAll — not yet implemented');
    return [];
  }

  async findById(id: string, tenantId: string): Promise<PurchaseOrderSummary | null> {
    log.warn({ id, tenantId }, 'PurchaseOrderService.findById — not yet implemented');
    return null;
  }

  async create(tenantId: string, _data: Record<string, unknown>): Promise<PurchaseOrderSummary> {
    log.warn({ tenantId }, 'PurchaseOrderService.create — not yet implemented');
    throw new Error('PurchaseOrder creation is not yet implemented');
  }
}
