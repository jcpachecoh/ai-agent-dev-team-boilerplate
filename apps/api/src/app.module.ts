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
import { SupplyItemsModule } from './supplyitems/supplyitems.module';
import { LockModule } from './lock/lock.module';
import { MesAuthModule } from './mes/auth/mes-auth.module';
import { PlantModule } from './mes/plant/plant.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuthModule,
    MesAuthModule,
    PlantModule,
    AuditModule,
    SupplyItemsModule,
    LockModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
