export interface PurchaseOrder {
  id: string;
  tenantId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseOrderRepository {
  findAll(tenantId: string): Promise<PurchaseOrder[]>;
  findById(id: string, tenantId: string): Promise<PurchaseOrder | null>;
}

export interface IPurchaseOrderService {
  findAll(tenantId: string): Promise<PurchaseOrder[]>;
  findById(id: string, tenantId: string): Promise<PurchaseOrder | null>;
}
