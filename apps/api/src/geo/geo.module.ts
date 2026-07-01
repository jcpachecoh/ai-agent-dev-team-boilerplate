import { Module } from '@nestjs/common';
import { GeoController } from './controller/geo.controller';
import { GeoRepository } from './repository/geo.repository';
import { GeoService } from './service/geo.service';

@Module({
  controllers: [GeoController],
  providers: [GeoService, GeoRepository],
  exports: [GeoService],
})
export class GeoModule {}
