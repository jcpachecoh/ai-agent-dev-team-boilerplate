import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSuiteDto {
  @ApiProperty({ maxLength: 120, example: 'Authentication Tests' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, example: 'All tests related to auth flows' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
