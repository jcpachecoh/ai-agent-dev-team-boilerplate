import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyCategoriesController } from './controller/supply-categories.controller';
import { SupplyCategoriesResolver } from './resolver/supply-categories.resolver';
import { SupplyCategoriesRepository } from './repository/supply-categories.repository';
import { SupplyCategoriesService } from './service/supply-categories.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupplyCategoriesController],
  providers: [SupplyCategoriesRepository, SupplyCategoriesService, SupplyCategoriesResolver],
  exports: [SupplyCategoriesService],
})
export class SupplyCategoriesModule {}
