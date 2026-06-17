import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyItemsController } from './controller/supplyitems.controller';
import { SupplyItemsRepository } from './repository/supplyitems.repository';
import { SupplyItemsService } from './service/supplyitems.service';
import { SupplyItemsResolver } from './resolver/supplyitems.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [SupplyItemsController],
  providers: [SupplyItemsRepository, SupplyItemsService, SupplyItemsResolver],
  exports: [SupplyItemsService],
})
export class SupplyItemsModule {}
