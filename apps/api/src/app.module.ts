import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevModule } from './dev/dev.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { CloudflareR2StorageProvider } from './storage/providers/cloudflare-r2/cloudflare-r2.provider';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuditInterceptor } from './audit/audit.interceptor';
import { LockModule } from './lock/lock.module';
import { MesAuthModule } from './mes/auth/mes-auth.module';
import { PlantModule } from './mes/plant/plant.module';
import { SupplyItemsModule } from './supplyitems/supplyitems.module';
import { RecipeCategoriesModule } from './recipe-categories/recipe-categories.module';
import { SupplyCategoriesModule } from './supply-categories/supply-categories.module';
import { InventoryModule } from './inventory/inventory.module';
import { GraphqlModule } from './graphql/graphql.module';
import { UserModule } from './user/user.module';
import { SupplierModule } from './supplier/supplier.module';
import { SupplierProductModule } from './supplier-product/supplier-product.module';
import { RecipeModule } from './recipe/recipe.module';
import { RecipeImagesModule } from './recipe-images/recipe-images.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { TenantModule } from './tenant/tenant.module';
import { PayrollModule } from './payroll/payroll.module';
import { EmployeeSocialProfileModule } from './employee-social-profile/employee-social-profile.module';
import { EmployeeFinancialProfileModule } from './employee-financial-profile/employee-financial-profile.module';
import { EmployeePersonalDataModule } from './employee-personal-data/employee-personal-data.module';
import { GeoModule } from './geo/geo.module';
import { AdminModule } from './admin/admin.module';
import { LocationsModule } from './locations/locations.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TurnosModule } from './turnos/turnos.module';
import { SupplierDocumentsModule } from './supplier-documents/supplier-documents.module';
const conditionalModules = process.env.NODE_ENV !== 'production' ? [DevModule] : [];
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ...conditionalModules,
    StorageModule.forRoot({ provider: CloudflareR2StorageProvider }),
    PrismaModule,
    EmailModule,
    AuthModule,
    MesAuthModule,
    PlantModule,
    AuditModule,
    LockModule,
    SupplyItemsModule,
    SupplyCategoriesModule,
    RecipeCategoriesModule,
    InventoryModule,
    GraphqlModule,
    UserModule,
    SupplierModule,
    SupplierProductModule,
    RecipeModule,
    RecipeImagesModule,
    PurchaseOrderModule,
    TenantModule,
    PayrollModule,
    EmployeeSocialProfileModule,
    EmployeeFinancialProfileModule,
    EmployeePersonalDataModule,
    GeoModule,
    AdminModule,
    LocationsModule,
    AttendanceModule,
    TurnosModule,
    SupplierDocumentsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
