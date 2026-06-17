import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuditInterceptor } from './audit/audit.interceptor';
import { LockModule } from './lock/lock.module';
import { MesAuthModule } from './mes/auth/mes-auth.module';
import { PlantModule } from './mes/plant/plant.module';
import { SupplyItemsModule } from './supplyitems/supplyitems.module';
import { GraphqlModule } from './graphql/graphql.module';
import { UserModule } from './user/user.module';
import { SupplierModule } from './supplier/supplier.module';
import { SupplierProductModule } from './supplier-product/supplier-product.module';
import { RecipeModule } from './recipe/recipe.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuthModule,
    MesAuthModule,
    PlantModule,
    AuditModule,
    LockModule,
    SupplyItemsModule,
    GraphqlModule,
    UserModule,
    SupplierModule,
    SupplierProductModule,
    RecipeModule,
    PurchaseOrderModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
