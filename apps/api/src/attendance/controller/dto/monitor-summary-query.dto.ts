import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import type {
  AttendanceClasificacion,
  AttendanceMonitorPeriod,
} from '../../interfaces/attendance.interfaces';

export class MonitorSummaryQueryDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year'] })
  @IsEnum(['day', 'week', 'month', 'year'])
  period!: AttendanceMonitorPeriod;

  @ApiProperty({ example: '2026-06-18' })
  @IsISO8601()
  anchorDate!: string;

  @ApiPropertyOptional({
    enum: ['administrativo', 'operaciones', 'todos'],
    description: 'Filtro por clasificación de mano de obra',
  })
  @IsOptional()
  @IsEnum(['administrativo', 'operaciones', 'todos'], {
    message: 'clasificacion debe ser administrativo, operaciones o todos',
  })
  clasificacion?: AttendanceClasificacion;
}
