import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ maxLength: 100, example: 'My Project' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    maxLength: 60,
    example: 'my-project',
    description: 'Lowercase letters, numbers, and hyphens only',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, and hyphens only' })
  @MaxLength(60)
  slug!: string;

  @ApiPropertyOptional({ maxLength: 500, example: 'A brief description of the project' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
