import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { DevController } from './dev.controller';

@Module({
  imports: [AttendanceModule],
  controllers: [DevController],
})
export class DevModule {}
