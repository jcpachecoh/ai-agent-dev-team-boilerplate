import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

import { DATE_ONLY_REGEX } from '../../turno-assignments.utils';

export class GetWeeklyShiftPlanQueryDto {
  @ApiProperty({ description: 'ID de la sede' })
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiProperty({
    description: 'Cualquier fecha de la semana (YYYY-MM-DD); se normaliza al lunes',
    example: '2026-07-13',
  })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'weekStart debe ser YYYY-MM-DD' })
  weekStart!: string;
}
