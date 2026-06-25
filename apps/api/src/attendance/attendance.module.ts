import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
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
  ],
  exports: [AttendanceService, AttendanceMonitorSummaryService],
})
export class AttendanceModule {}
