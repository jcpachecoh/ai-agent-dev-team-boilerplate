import { Module } from '@nestjs/common';
import { PurchaseOrderRepository } from './repository/purchase-order.repository';
import { PurchaseOrderService } from './service/purchase-order.service';
import { PurchaseOrderResolver } from './resolver/purchase-order.resolver';

@Module({
  providers: [PurchaseOrderRepository, PurchaseOrderService, PurchaseOrderResolver],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
