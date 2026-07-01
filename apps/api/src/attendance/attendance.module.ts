import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MobileAttendanceRepository } from './mobile/repository/mobile-attendance.repository';
import { MobileAttendanceResolver } from './mobile/resolver/mobile-attendance.resolver';
import { MobileAttendanceService } from './mobile/service/mobile-attendance.service';
import { AttendanceController } from './controller/attendance.controller';
import { AttendanceResolver } from './resolver/attendance.resolver';
import { AttendanceService } from './service/attendance.service';
import { AttendanceMonitorSummaryService } from './service/attendance-monitor-summary.service';
import { AttendanceRepository } from './repository/attendance.repository';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceMonitorSummaryService,
    AttendanceRepository,
    AttendanceResolver,
    MobileAttendanceRepository,
    MobileAttendanceService,
    MobileAttendanceResolver,
  ],
  exports: [AttendanceService, AttendanceMonitorSummaryService],
})
export class AttendanceModule {}
