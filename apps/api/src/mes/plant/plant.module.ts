import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { SupplyItemsModule } from '../../supplyitems/supplyitems.module';
import { MesAuthModule } from '../auth/mes-auth.module';
import { MesJwtGuard } from '../auth/guards/mes-jwt.guard';
import { MesRolesGuard } from '../auth/guards/mes-roles.guard';
import { PlantController } from './controller/plant.controller';
import { PlantGateway } from './gateway/plant.gateway';
import { PlantRepository } from './repository/plant.repository';
import { PhaseChainService } from './service/phase-chain.service';
import { PlantEventsService } from './service/plant-events.service';
import { PlantService } from './service/plant.service';

@Module({
  imports: [
    PrismaModule,
    SupplyItemsModule,
    MesAuthModule,
    JwtModule.register({
      secret:
        process.env.MES_JWT_SECRET ??
        process.env.JWT_SECRET ??
        'mes-dev-secret-change-in-production',
    }),
  ],
  controllers: [PlantController],
  providers: [
    PlantRepository,
    PlantService,
    PhaseChainService,
    PlantEventsService,
    PlantGateway,
    MesJwtGuard,
    MesRolesGuard,
  ],
})
export class PlantModule {}
