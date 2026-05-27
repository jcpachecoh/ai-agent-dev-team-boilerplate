import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SupplyItemsModule } from '../../supplyitems/supplyitems.module';
import { MesAuthModule } from '../auth/mes-auth.module';
import { MesJwtGuard } from '../auth/guards/mes-jwt.guard';
import { PlantController } from './controller/plant.controller';
import { PlantRepository } from './repository/plant.repository';
import { PlantService } from './service/plant.service';

@Module({
  imports: [PrismaModule, SupplyItemsModule, MesAuthModule],
  controllers: [PlantController],
  providers: [PlantRepository, PlantService, MesJwtGuard],
})
export class PlantModule {}
