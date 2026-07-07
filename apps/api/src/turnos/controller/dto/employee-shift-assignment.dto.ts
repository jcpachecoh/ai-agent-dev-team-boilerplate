import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoJornada } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

import { DATE_ONLY_REGEX } from '../../turno-assignments.utils';

export class CreateEmployeeShiftAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  turnoId!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'effectiveFrom debe ser YYYY-MM-DD' })
  effectiveFrom!: string;
}

export class PatchEmployeeShiftAssignmentDto {
  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'effectiveTo debe ser YYYY-MM-DD' })
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  turnoId?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'effectiveFrom debe ser YYYY-MM-DD' })
  effectiveFrom?: string;
}

export class EmployeeShiftAssignmentTurnoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  sigla!: string;

  @ApiProperty()
  horaInicio!: string;

  @ApiProperty()
  horaFin!: string;

  @ApiProperty({ enum: TurnoJornada })
  jornada!: TurnoJornada;

  @ApiProperty()
  locationId!: string;

  @ApiProperty({ type: [Number] })
  daysOfWeek!: number[];
}

export class EmployeeShiftAssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  turnoId!: string;

  @ApiProperty()
  effectiveFrom!: string;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo!: string | null;

  @ApiProperty({ type: EmployeeShiftAssignmentTurnoDto })
  turno!: EmployeeShiftAssignmentTurnoDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
