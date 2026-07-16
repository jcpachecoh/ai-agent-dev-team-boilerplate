import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';
import type { AttendanceCardQuery } from '../../interfaces/attendance.interfaces';

export class AttendanceCardQueryDto implements AttendanceCardQuery {
  @ApiProperty({ example: '2026-05-01', description: 'Fecha inicio (ISO 8601)' })
  @IsISO8601()
  dateFrom!: string;

  @ApiProperty({ example: '2026-07-31', description: 'Fecha fin (ISO 8601)' })
  @IsISO8601()
  dateTo!: string;

  @ApiPropertyOptional({
    description: 'Sede de contexto (requerida para ROTANTE sin sede fija en ficha)',
  })
  @IsString()
  @IsOptional()
  locationId?: string;
}
