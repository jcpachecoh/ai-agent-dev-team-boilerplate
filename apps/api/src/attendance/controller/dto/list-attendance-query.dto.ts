import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsISO8601, IsInt, Min, Max } from 'class-validator';
import type { ListHistoryInput } from '../../interfaces/attendance.interfaces';

export class ListAttendanceQueryDto implements ListHistoryInput {
  @ApiPropertyOptional({ description: 'Filtrar por User ID del empleado' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de sede' })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Fecha inicio (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Fecha fin (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  dateTo?: string;

  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}

export class ActiveAttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por sede (requerido si no hay JWT tenant)' })
  @IsString()
  @IsOptional()
  locationId?: string;
}

export class OvertimeSummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-06-10',
    description: 'Fecha (ISO 8601). Por defecto: hoy en Bogotá',
  })
  @IsISO8601()
  @IsOptional()
  date?: string;
}
