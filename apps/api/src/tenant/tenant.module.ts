import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantController } from './controller/tenant.controller';
import { TenantRepository } from './repository/tenant.repository';
import { TenantService } from './service/tenant.service';
import { TenantResolver } from './resolver/tenant.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantRepository, TenantService, TenantResolver],
  exports: [TenantService],
})
export class TenantModule {}
