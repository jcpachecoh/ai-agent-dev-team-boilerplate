import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnoAssignmentsController } from './controller/turno-assignments.controller';
import { TurnosController } from './controller/turnos.controller';
import { TurnoAssignmentsRepository } from './repository/turno-assignments.repository';
import { TurnosRepository } from './repository/turnos.repository';
import { TurnoAssignmentsImportService } from './service/turno-assignments-import.service';
import { TurnoAssignmentsTemplateService } from './service/turno-assignments-template.service';
import { TurnoAssignmentsService } from './service/turno-assignments.service';
import { TurnosExcelService } from './service/turnos-excel.service';
import { TurnosService } from './service/turnos.service';

@Module({
  imports: [PrismaModule, AuthModule, LocationsModule],
  controllers: [TurnosController, TurnoAssignmentsController],
  providers: [
    TurnosService,
    TurnosRepository,
    TurnosExcelService,
    TurnoAssignmentsService,
    TurnoAssignmentsRepository,
    TurnoAssignmentsTemplateService,
    TurnoAssignmentsImportService,
  ],
  exports: [TurnosService, TurnoAssignmentsService],
})
export class TurnosModule {}
