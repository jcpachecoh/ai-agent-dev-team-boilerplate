import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnosModule } from '../turnos/turnos.module';
import { MobileAttendanceRepository } from './mobile/repository/mobile-attendance.repository';
import { MobileAttendanceResolver } from './mobile/resolver/mobile-attendance.resolver';
import { MobileAttendanceService } from './mobile/service/mobile-attendance.service';
import { AttendanceController } from './controller/attendance.controller';
import { AttendanceResolver } from './resolver/attendance.resolver';
import { AttendanceService } from './service/attendance.service';
import { AttendanceCardService } from './service/attendance-card.service';
import { AttendanceMonitorSummaryService } from './service/attendance-monitor-summary.service';
import { AttendanceControlPanelService } from './service/attendance-control-panel.service';
import { AttendanceComparisonService } from './service/attendance-comparison.service';
import { AttendanceCollaboratorsService } from './service/attendance-collaborators.service';
import { AttendanceCollaboratorsExcelService } from './service/attendance-collaborators-excel.service';
import { AttendanceCollaboratorsPdfService } from './service/attendance-collaborators-pdf.service';
import { AttendanceRepository } from './repository/attendance.repository';
import { AttendanceCollaboratorsRepository } from './repository/attendance-collaborators.repository';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, LocationsModule, EmailModule, TurnosModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceCardService,
    AttendanceMonitorSummaryService,
    AttendanceControlPanelService,
    AttendanceComparisonService,
    AttendanceCollaboratorsService,
    AttendanceCollaboratorsExcelService,
    AttendanceCollaboratorsPdfService,
    AttendanceRepository,
    AttendanceCollaboratorsRepository,
    AttendanceResolver,
    MobileAttendanceRepository,
    MobileAttendanceService,
    MobileAttendanceResolver,
  ],
  exports: [
    AttendanceService,
    AttendanceCardService,
    AttendanceMonitorSummaryService,
    AttendanceControlPanelService,
    AttendanceComparisonService,
    AttendanceCollaboratorsService,
  ],
})
export class AttendanceModule {}
