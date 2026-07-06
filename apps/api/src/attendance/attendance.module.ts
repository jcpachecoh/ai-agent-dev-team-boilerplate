import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
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
import { AttendanceRepository } from './repository/attendance.repository';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceCardService,
    AttendanceMonitorSummaryService,
    AttendanceControlPanelService,
    AttendanceComparisonService,
    AttendanceRepository,
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
  ],
})
export class AttendanceModule {}
