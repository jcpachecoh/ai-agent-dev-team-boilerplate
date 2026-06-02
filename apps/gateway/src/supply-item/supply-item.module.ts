import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyItemRepository } from './repository/supply-item.repository';
import { SupplyItemService } from './service/supply-item.service';
import { SupplyItemResolver } from './resolver/supply-item.resolver';

@Module({
  imports: [PrismaModule],
  providers: [SupplyItemRepository, SupplyItemService, SupplyItemResolver],
  exports: [SupplyItemService],
})
export class SupplyItemModule {}
