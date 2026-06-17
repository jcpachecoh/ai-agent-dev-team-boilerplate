import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyItemsModule } from '../supplyitems/supplyitems.module';
import { SupplyCategoriesController } from './controller/supply-categories.controller';
import { SupplyCategoriesResolver } from './resolver/supply-categories.resolver';
import { SupplyCategoriesRepository } from './repository/supply-categories.repository';
import { SupplyCategoriesService } from './service/supply-categories.service';

@Module({
  imports: [PrismaModule, SupplyItemsModule],
  controllers: [SupplyCategoriesController],
  providers: [SupplyCategoriesRepository, SupplyCategoriesService, SupplyCategoriesResolver],
  exports: [SupplyCategoriesService],
})
export class SupplyCategoriesModule {}
