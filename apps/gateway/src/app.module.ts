import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';
import { GqlAuthGuard } from './auth/guards/gql-auth.guard';
import { GraphqlModule } from './graphql/graphql.module';
import { CommonThrottlerModule } from './common/throttler.module';
import { SupplierModule } from './supplier/supplier.module';
import { SupplierProductModule } from './supplier-product/supplier-product.module';
import { SupplyItemModule } from './supply-item/supply-item.module';
import { RecipeModule } from './recipe/recipe.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { PubSubModule } from './pubsub/pubsub.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: { level: process.env['LOG_LEVEL'] ?? 'info' },
    }),
    ConfigModule,
    PrismaModule,
    HealthModule,
    MetricsModule,
    AuthModule,
    GraphqlModule,
    CommonThrottlerModule,
    SupplierModule,
    SupplierProductModule,
    SupplyItemModule,
    RecipeModule,
    PurchaseOrderModule,
    TenantModule,
    UserModule,
    PubSubModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: GqlAuthGuard }],
})
export class AppModule {}
