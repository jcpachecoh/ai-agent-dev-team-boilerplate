import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';
import type { AttendanceCardQuery } from '../../interfaces/attendance.interfaces';

export class AttendanceCardQueryDto implements AttendanceCardQuery {
  @ApiProperty({ example: '2026-05-01', description: 'Fecha inicio (ISO 8601)' })
  @IsISO8601()
  dateFrom!: string;

  @ApiProperty({ example: '2026-07-31', description: 'Fecha fin (ISO 8601)' })
  @IsISO8601()
  dateTo!: string;
}
