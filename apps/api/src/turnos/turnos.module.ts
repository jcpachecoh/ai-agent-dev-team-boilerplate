import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DailyCostCenterModule } from '../daily-cost-center/daily-cost-center.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnoAssignmentsController } from './controller/turno-assignments.controller';
import { EmployeeShiftAssignmentsController } from './controller/employee-shift-assignments.controller';
import { ShiftResolutionController } from './controller/shift-resolution.controller';
import { TurnosController } from './controller/turnos.controller';
import { WeeklyShiftPlanController } from './controller/weekly-shift-plan.controller';
import { EmployeeShiftAssignmentsRepository } from './repository/employee-shift-assignments.repository';
import { TurnoAssignmentsRepository } from './repository/turno-assignments.repository';
import { TurnosRepository } from './repository/turnos.repository';
import { WeeklyShiftPlanRepository } from './repository/weekly-shift-plan.repository';
import { EmployeeShiftAssignmentsService } from './service/employee-shift-assignments.service';
import { ShiftResolutionService } from './service/shift-resolution.service';
import { TurnoAssignmentsImportService } from './service/turno-assignments-import.service';
import { TurnoAssignmentsTemplateService } from './service/turno-assignments-template.service';
import { TurnoAssignmentsService } from './service/turno-assignments.service';
import { TurnosExcelService } from './service/turnos-excel.service';
import { TurnosService } from './service/turnos.service';
import { WeeklyShiftPlanService } from './service/weekly-shift-plan.service';

@Module({
  imports: [PrismaModule, AuthModule, LocationsModule, DailyCostCenterModule],
  controllers: [
    TurnosController,
    ShiftResolutionController,
    TurnoAssignmentsController,
    EmployeeShiftAssignmentsController,
    WeeklyShiftPlanController,
  ],
  providers: [
    TurnosService,
    TurnosRepository,
    TurnosExcelService,
    TurnoAssignmentsService,
    TurnoAssignmentsRepository,
    TurnoAssignmentsTemplateService,
    TurnoAssignmentsImportService,
    EmployeeShiftAssignmentsService,
    EmployeeShiftAssignmentsRepository,
    ShiftResolutionService,
    WeeklyShiftPlanService,
    WeeklyShiftPlanRepository,
  ],
  exports: [
    TurnosService,
    TurnoAssignmentsService,
    ShiftResolutionService,
    EmployeeShiftAssignmentsService,
    WeeklyShiftPlanService,
  ],
})
export class TurnosModule {}
