import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRequirementDto {
  @ApiProperty({ maxLength: 200, example: 'User must be able to log in with email and password' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'REQ-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @ApiPropertyOptional({ maxLength: 1000, example: 'Detailed description of the requirement' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
