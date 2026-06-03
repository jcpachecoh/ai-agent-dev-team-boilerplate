import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplyItemsController } from './controller/supplyitems.controller';
import { SupplyItemsRepository } from './repository/supplyitems.repository';
import { SupplyItemsService } from './service/supplyitems.service';
import { SupplyItemsResolver } from './resolver/supplyitems.resolver';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SupplyItemsController],
  providers: [SupplyItemsRepository, SupplyItemsService, SupplyItemsResolver],
  exports: [SupplyItemsService],
})
export class SupplyItemsModule {}
