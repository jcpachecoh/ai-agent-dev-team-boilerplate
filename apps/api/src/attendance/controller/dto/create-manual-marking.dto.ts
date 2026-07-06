import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceEventType } from '@prisma/client';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ATTENDANCE_MANUAL_MARKING_REASONS } from '../../attendance.constants';
import type { CreateManualMarkingInput } from '../../interfaces/attendance.interfaces';

export class CreateManualMarkingDto implements CreateManualMarkingInput {
  @ApiProperty({ example: '2026-06-10', description: 'Fecha de jornada (ISO 8601)' })
  @IsISO8601()
  workDate!: string;

  @ApiProperty({ enum: AttendanceEventType })
  @IsEnum(AttendanceEventType)
  eventType!: AttendanceEventType;

  @ApiProperty({ description: 'Fecha y hora de la marcación (ISO 8601)' })
  @IsISO8601()
  timestamp!: string;

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
}
