import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CompleteStepDto {
  @ApiProperty({ description: 'Phase execution ID (stepId)', example: 'execution-uuid' })
  @IsString()
  @IsNotEmpty()
  stepId!: string;

  @ApiPropertyOptional({ example: 14 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualMinutes?: number;

  @ApiPropertyOptional({ example: '12.500' })
  @IsString()
  @IsOptional()
  producedQuantity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
