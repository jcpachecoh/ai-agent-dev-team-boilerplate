import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TurnosModule } from '../turnos/turnos.module';
import { VacationsModule } from '../vacations/vacations.module';
import { LaborLegalParametersModule } from '../labor-legal-parameters/labor-legal-parameters.module';
import { OvertimeModule } from '../overtime/overtime.module';
import { MedicalLeavesModule } from '../medical-leaves/medical-leaves.module';
import { PayrollNovedadesModule } from '../payroll-novedades/payroll-novedades.module';
import { DataConsentModule } from '../data-consent/data-consent.module';
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
import { ManualMarkingProvisionService } from './service/manual-marking-provision.service';
import { JornadaCutoffRepository } from './repository/jornada-cutoff.repository';
import { JornadaCutoffService } from './service/jornada-cutoff.service';
import { JornadaCutoffScheduler } from './jobs/jornada-cutoff.scheduler';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    LocationsModule,
    EmailModule,
    TurnosModule,
    VacationsModule,
    LaborLegalParametersModule,
    OvertimeModule,
    PayrollNovedadesModule,
    MedicalLeavesModule,
    DataConsentModule,
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceCardService,
    ManualMarkingProvisionService,
    AttendanceMonitorSummaryService,
    AttendanceControlPanelService,
    AttendanceComparisonService,
    AttendanceCollaboratorsService,
    AttendanceCollaboratorsExcelService,
    AttendanceCollaboratorsPdfService,
    AttendanceRepository,
    AttendanceCollaboratorsRepository,
    JornadaCutoffRepository,
    JornadaCutoffService,
    JornadaCutoffScheduler,
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
    JornadaCutoffService,
  ],
})
export class AttendanceModule {}
