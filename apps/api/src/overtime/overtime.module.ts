import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnosModule } from '../turnos/turnos.module';
import { OvertimeController } from './controller/overtime.controller';
import { OvertimeRepository } from './repository/overtime.repository';
import { OvertimeApprovalService } from './service/overtime-approval.service';
import { OvertimeDetectionService } from './service/overtime-detection.service';
import { OvertimeNotificationService } from './service/overtime-notification.service';
import { OvertimeService } from './service/overtime.service';

/** CONN-04a — detección automática de tiempo extra y cascada de aprobación. */
@Module({
  imports: [PrismaModule, AuthModule, TurnosModule],
  controllers: [OvertimeController],
  providers: [
    OvertimeRepository,
    OvertimeService,
    OvertimeApprovalService,
    OvertimeDetectionService,
    OvertimeNotificationService,
  ],
  exports: [OvertimeDetectionService, OvertimeRepository, OvertimeService],
})
export class OvertimeModule {}
