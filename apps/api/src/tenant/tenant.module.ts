import { Module } from '@nestjs/common';
import { TenantRepository } from './repository/tenant.repository';
import { TenantService } from './service/tenant.service';
import { TenantResolver } from './resolver/tenant.resolver';

@Module({
  providers: [TenantRepository, TenantService, TenantResolver],
  exports: [TenantService],
})
export class TenantModule {}
