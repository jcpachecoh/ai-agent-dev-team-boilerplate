import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { Queue } from 'bullmq';
import { SupplierService } from './supplier.service';
import { SupplierProductService } from './supplier-product.service';
import { SupplyItemService } from './supply-item.service';
import { GatewayAuthService } from './auth.service';
import { TenantService } from './tenant.service';
import { EmailService } from './email.service';
import { FileService } from './file.service';
import { PurchaseOrderService } from './purchase-order.service';
import { RecipeService } from './recipe.service';

export interface Services {
  supplier: SupplierService;
  supplierProduct: SupplierProductService;
  supplyItem: SupplyItemService;
  auth: GatewayAuthService;
  tenant: TenantService;
  email: EmailService;
  file: FileService;
  purchaseOrder: PurchaseOrderService;
  recipe: RecipeService;
}

interface ServiceDeps {
  prisma: PrismaClient;
  redis: Redis;
  log: Logger;
  queue?: Queue;
}

export function createServices(deps: ServiceDeps): Services {
  const { prisma, redis, log } = deps;

  // A dummy queue for EmailService when none is provided (e.g. in tests)
  const queue =
    deps.queue ??
    new Queue('email', {
      connection: redis,
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    });

  return {
    supplier: new SupplierService(prisma, redis, log),
    supplierProduct: new SupplierProductService(prisma, redis, log),
    supplyItem: new SupplyItemService(prisma, redis, log),
    auth: new GatewayAuthService(prisma, redis, log),
    tenant: new TenantService(prisma, redis, log),
    email: new EmailService(queue),
    file: new FileService(prisma, redis, log),
    purchaseOrder: new PurchaseOrderService(prisma, redis, log),
    recipe: new RecipeService(prisma, redis, log),
  };
}
