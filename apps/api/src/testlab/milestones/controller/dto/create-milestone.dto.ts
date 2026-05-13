import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMilestoneDto {
  @ApiProperty({ maxLength: 120, example: 'v1.0 Release' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ maxLength: 500, example: 'First stable release' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
