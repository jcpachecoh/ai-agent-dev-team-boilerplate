import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionOrderStatus, ProductionPriority, ProductionShift } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ enum: ProductionOrderStatus })
  @IsEnum(ProductionOrderStatus)
  @IsOptional()
  status?: ProductionOrderStatus;

  @ApiPropertyOptional({ enum: ProductionShift })
  @IsEnum(ProductionShift)
  @IsOptional()
  shift?: ProductionShift;

  @ApiPropertyOptional({ enum: ProductionPriority })
  @IsEnum(ProductionPriority)
  @IsOptional()
  priority?: ProductionPriority;

  @ApiPropertyOptional({
    example: '2026-06-01T00:00:00.000Z',
    description: 'Inclusive lower bound on plannedStartAt',
  })
  @IsDateString()
  @IsOptional()
  plannedStartFrom?: string;

  @ApiPropertyOptional({
    example: '2026-06-30T23:59:59.999Z',
    description: 'Inclusive upper bound on plannedStartAt',
  })
  @IsDateString()
  @IsOptional()
  plannedStartTo?: string;
}
