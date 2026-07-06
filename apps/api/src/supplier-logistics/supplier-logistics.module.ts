import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplierLogisticsResolver } from './resolver/supplier-logistics.resolver';
import { SupplierLogisticsRepository } from './repository/supplier-logistics.repository';
import { SupplierLogisticsService } from './service/supplier-logistics.service';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [SupplierLogisticsRepository, SupplierLogisticsService, SupplierLogisticsResolver],
  exports: [SupplierLogisticsService],
})
export class SupplierLogisticsModule {}
