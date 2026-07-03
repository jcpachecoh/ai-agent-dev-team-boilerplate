import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

import { DATE_ONLY_REGEX } from '../../turno-assignments.utils';

export class GetWeeklyAssignmentsQueryDto {
  @ApiProperty({
    example: '2026-07-06',
    description: 'Cualquier fecha de la semana (se normaliza a lunes)',
  })
  @IsString()
  @Matches(DATE_ONLY_REGEX, { message: 'weekStart debe tener formato YYYY-MM-DD' })
  weekStart!: string;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre o documento' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['nombre', 'documento'], default: 'nombre' })
  @IsOptional()
  @IsIn(['nombre', 'documento'])
  field?: 'nombre' | 'documento';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type((): NumberConstructor => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type((): NumberConstructor => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
