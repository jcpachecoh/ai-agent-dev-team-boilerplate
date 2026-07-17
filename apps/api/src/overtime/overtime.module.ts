import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EmployeeCatalogRepository } from '../payroll/repository/employee-catalog.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnosModule } from '../turnos/turnos.module';
import { OvertimeController } from './controller/overtime.controller';
import { OvertimeRepository } from './repository/overtime.repository';
import { OvertimeAdminCreateService } from './service/overtime-admin-create.service';
import { OvertimeApprovalService } from './service/overtime-approval.service';
import { OvertimeDetectionService } from './service/overtime-detection.service';
import { OvertimeNotificationService } from './service/overtime-notification.service';
import { OvertimeService } from './service/overtime.service';

/** CONN-04a/04b — detección automática, cascada de aprobación y create admin. */
@Module({
  imports: [PrismaModule, AuthModule, TurnosModule],
  controllers: [OvertimeController],
  providers: [
    OvertimeRepository,
    OvertimeService,
    OvertimeApprovalService,
    OvertimeDetectionService,
    OvertimeNotificationService,
    OvertimeAdminCreateService,
    EmployeeCatalogRepository,
  ],
  exports: [OvertimeDetectionService, OvertimeRepository, OvertimeService],
})
export class OvertimeModule {}
