import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationsRepository } from './repository/locations.repository';
import { UserLocationsRepository } from './repository/user-locations.repository';
import { LocationsResolver } from './resolver/locations.resolver';
import { UserLocationsResolver } from './resolver/user-locations.resolver';
import { LocationsService } from './service/locations.service';
import { UserLocationsService } from './service/user-locations.service';

@Module({
  imports: [PrismaModule],
  providers: [
    LocationsRepository,
    LocationsService,
    LocationsResolver,
    UserLocationsRepository,
    UserLocationsService,
    UserLocationsResolver,
  ],
  exports: [LocationsService, UserLocationsService],
})
export class LocationsModule {}
