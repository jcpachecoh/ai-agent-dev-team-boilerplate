import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceController } from './controller/attendance.controller';
import { AttendanceService } from './service/attendance.service';
import { AttendanceRepository } from './repository/attendance.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository],
  exports: [AttendanceService],
})
export class AttendanceModule {}
