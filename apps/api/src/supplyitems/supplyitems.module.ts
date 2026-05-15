import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyItemsController } from './controller/supplyitems.controller';
import { SupplyItemsService } from './service/supplyitems.service';
import { SupplyItemsRepository } from './repository/supplyitems.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SupplyItemsController],
  providers: [SupplyItemsService, SupplyItemsRepository],
  exports: [SupplyItemsService],
})
export class SupplyItemsModule {}
