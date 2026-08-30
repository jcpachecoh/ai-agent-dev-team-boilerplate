import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601 } from 'class-validator';
import type { AttendanceMonitorPeriod } from '../../interfaces/attendance.interfaces';

export class MonitorSummaryQueryDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year'] })
  @IsEnum(['day', 'week', 'month', 'year'])
  period!: AttendanceMonitorPeriod;

  @ApiProperty({ example: '2026-06-18' })
  @IsISO8601()
  anchorDate!: string;
}
