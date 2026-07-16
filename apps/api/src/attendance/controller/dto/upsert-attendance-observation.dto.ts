import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { UpsertObservationInput } from '../../interfaces/attendance.interfaces';

export class UpsertAttendanceObservationDto implements UpsertObservationInput {
  @ApiProperty({ example: '2026-06-10', description: 'Fecha de jornada (ISO 8601)' })
  @IsISO8601()
  workDate!: string;

  @ApiProperty({ maxLength: 500, description: 'Nota de la observación' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note!: string;

  @ApiPropertyOptional({ description: 'Sede de contexto para ROTANTE (CONN-12)' })
  @IsString()
  @IsOptional()
  locationId?: string;
}
