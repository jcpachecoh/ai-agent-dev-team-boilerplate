import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { TurnoAssignmentType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

import { DATE_ONLY_REGEX } from '../../turno-assignments.utils';

export class CreateTurnoAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: '2026-07-06' })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'workDate debe tener formato YYYY-MM-DD' })
  workDate!: string;

  @ApiPropertyOptional({ description: 'Obligatorio cuando type es ASSIGNED (por defecto)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  turnoId?: string;

  @ApiPropertyOptional({ enum: TurnoAssignmentType, default: TurnoAssignmentType.ASSIGNED })
  @IsOptional()
  @IsEnum(TurnoAssignmentType)
  type?: TurnoAssignmentType;
}
