import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyItemsRepository } from './repository/supplyitems.repository';
import { SupplyItemsService } from './service/supplyitems.service';

@Module({
  imports: [PrismaModule],
  providers: [SupplyItemsRepository, SupplyItemsService],
  exports: [SupplyItemsService],
})
export class SupplyItemsModule {}
