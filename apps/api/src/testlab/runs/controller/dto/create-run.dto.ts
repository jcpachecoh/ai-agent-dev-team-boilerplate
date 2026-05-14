import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRunDto {
  @ApiProperty({ maxLength: 120, example: 'Regression Run – Sprint 14' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, example: 'Full regression pass before release' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
