import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { DATE_ONLY_REGEX } from '../../turno-assignments.utils';

export class GetBulkTemplateQueryDto {
  @ApiProperty({ example: '2026-08-01' })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'from debe tener formato YYYY-MM-DD' })
  from!: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'to debe tener formato YYYY-MM-DD' })
  to!: string;

  @ApiProperty({
    example: '1,2,3,4,5',
    description: 'Días ISO separados por coma (1=lunes...7=domingo)',
  })
  @IsString()
  weekdays!: string;

  @ApiProperty({ example: 'emp-1,emp-2', description: 'IDs de colaborador separados por coma' })
  @IsString()
  employeeIds!: string;
}
