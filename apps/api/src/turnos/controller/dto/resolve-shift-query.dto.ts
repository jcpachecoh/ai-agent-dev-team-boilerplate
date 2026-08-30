import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoJornada } from '@prisma/client';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

import { DATE_ONLY_REGEX } from '../../turno-assignments.utils';

export class ResolveShiftQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiProperty({ example: '2026-07-06' })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'workDate debe ser YYYY-MM-DD' })
  workDate!: string;
}

export class ResolvedShiftTurnoDto {
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

  @ApiProperty()
  targetMinutes!: number;
}

export class ResolvedShiftResponseDto {
  @ApiProperty({ enum: ['ASSIGNED', 'REST', 'NONE'] })
  kind!: 'ASSIGNED' | 'REST' | 'NONE';

  @ApiPropertyOptional({ enum: ['CALENDAR', 'EMPLOYEE_ASSIGNMENT'] })
  source?: 'CALENDAR' | 'EMPLOYEE_ASSIGNMENT';

  @ApiProperty()
  targetMinutes!: number;

  @ApiPropertyOptional({ type: ResolvedShiftTurnoDto, nullable: true })
  shift!: ResolvedShiftTurnoDto | null;
}
