import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import { DATE_ONLY_REGEX } from '../../../turnos/turno-assignments.utils';

export class ListAssignmentsQueryDto {
  @ApiProperty({ example: '2026-07-01', description: 'Fecha inicio (YYYY-MM-DD)' })
  @Matches(DATE_ONLY_REGEX, { message: 'from debe tener formato YYYY-MM-DD' })
  @IsNotEmpty()
  from!: string;

  @ApiProperty({ example: '2026-07-31', description: 'Fecha fin (YYYY-MM-DD)' })
  @Matches(DATE_ONLY_REGEX, { message: 'to debe tener formato YYYY-MM-DD' })
  @IsNotEmpty()
  to!: string;
}
