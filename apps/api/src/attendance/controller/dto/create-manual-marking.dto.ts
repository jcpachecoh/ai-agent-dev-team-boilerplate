import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceEventType } from '@prisma/client';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ATTENDANCE_MANUAL_MARKING_REASONS } from '../../attendance.constants';
import { CORRECCION_MARCACION_REASON } from '../../interfaces/manual-marking-provision.interfaces';
import type { CreateManualMarkingInput } from '../../interfaces/attendance.interfaces';

export class CreateManualMarkingDto implements CreateManualMarkingInput {
  @ApiProperty({ example: '2026-06-10', description: 'Fecha de jornada (ISO 8601)' })
  @IsISO8601()
  workDate!: string;

  @ApiPropertyOptional({
    enum: AttendanceEventType,
    description: 'Requerido solo para corrección de marcación',
  })
  @ValidateIf((dto: CreateManualMarkingDto) => dto.reason === CORRECCION_MARCACION_REASON)
  @IsEnum(AttendanceEventType)
  eventType?: AttendanceEventType;

  @ApiPropertyOptional({
    description: 'Fecha y hora de la marcación (ISO 8601). Solo corrección.',
  })
  @ValidateIf((dto: CreateManualMarkingDto) => dto.reason === CORRECCION_MARCACION_REASON)
  @IsISO8601()
  timestamp?: string;

  @ApiProperty({
    enum: ATTENDANCE_MANUAL_MARKING_REASONS,
    description: 'Motivo del registro/corrección manual',
  })
  @IsIn(ATTENDANCE_MANUAL_MARKING_REASONS)
  reason!: string;

  @ApiPropertyOptional({ description: 'ID del AttendanceLog (DEVICE) que esta marca corrige' })
  @IsString()
  @IsOptional()
  parentLogId?: string;

  @ApiPropertyOptional({
    description: 'Soporte obligatorio para motivos de nómina que lo requieren (NOM-14)',
  })
  @IsString()
  @IsOptional()
  supportStorageObjectId?: string;
}
