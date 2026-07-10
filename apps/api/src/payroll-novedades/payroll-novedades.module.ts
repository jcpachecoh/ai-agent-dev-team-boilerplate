import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { PayrollNovedadesController } from './controller/payroll-novedades.controller';
import { NovedadTypeConfigRepository } from './repository/novedad-type-config.repository';
import { PayrollNovedadesRepository } from './repository/payroll-novedades.repository';
import { NovedadTypeConfigService } from './service/novedad-type-config.service';
import { PayrollNovedadesNotificationService } from './service/payroll-novedades-notification.service';
import { PayrollNovedadesService } from './service/payroll-novedades.service';

/** NOM-14 — novedades de nómina (ausencias, permisos, licencias). */
@Module({
  imports: [PrismaModule, AuthModule, LocationsModule, StorageModule],
  controllers: [PayrollNovedadesController],
  providers: [
    PayrollNovedadesRepository,
    NovedadTypeConfigRepository,
    PayrollNovedadesService,
    NovedadTypeConfigService,
    PayrollNovedadesNotificationService,
  ],
  exports: [PayrollNovedadesRepository, PayrollNovedadesService, NovedadTypeConfigService],
})
export class PayrollNovedadesModule {}
