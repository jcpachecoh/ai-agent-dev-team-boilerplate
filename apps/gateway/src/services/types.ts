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
import { ApiClient } from './api-client';
import { env } from '../config/env';

export interface Services {
  supplier: SupplierService;
  supplierProduct: SupplierProductService;
  supplyItem: SupplyItemService;
  auth: GatewayAuthService;
  api: ApiClient;
  tenant: TenantService;
  email: EmailService;
  file: FileService;
  purchaseOrder: PurchaseOrderService;
  recipe: RecipeService;
}

interface ServiceDeps {
  prisma: PrismaClient;
  redis: Redis | null;
  log: Logger;
  queue?: Queue | null;
}

export function createServices(deps: ServiceDeps): Services {
  const { prisma, redis, log } = deps;

  const queue: Queue | null =
    deps.queue !== undefined
      ? deps.queue
      : redis
        ? new Queue('email', {
            connection: redis,
            defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
          })
        : null;

  return {
    supplier: new SupplierService(prisma, redis, log),
    supplierProduct: new SupplierProductService(prisma, redis, log),
    supplyItem: new SupplyItemService(prisma, redis, log),
    auth: new GatewayAuthService(prisma, redis, log),
    api: new ApiClient(env.API_BASE_URL),
    tenant: new TenantService(prisma, redis, log),
    email: new EmailService(queue),
    file: new FileService(prisma, redis, log),
    purchaseOrder: new PurchaseOrderService(prisma, redis, log),
    recipe: new RecipeService(prisma, redis, log),
  };
}
