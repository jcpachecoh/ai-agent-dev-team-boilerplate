import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateExecutionRouteDto {
  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  operatorCount?: number;

  @ApiPropertyOptional({ example: '120.500', description: 'Decimal as string' })
  @IsOptional()
  @IsString()
  deliveredQuantity?: string;

  @ApiPropertyOptional({ example: 'operational-user-uuid' })
  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
