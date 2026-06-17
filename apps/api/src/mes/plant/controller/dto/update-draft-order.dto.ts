import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionPriority, ProductionShift } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDraftOrderDto {
  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  batchCount?: number;

  @ApiPropertyOptional({ enum: ProductionShift })
  @IsEnum(ProductionShift)
  @IsOptional()
  shift?: ProductionShift;

  @ApiPropertyOptional({ enum: ProductionPriority })
  @IsEnum(ProductionPriority)
  @IsOptional()
  priority?: ProductionPriority;

  @ApiPropertyOptional({ example: '2026-06-01T08:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  plannedStartAt?: string;

  @ApiPropertyOptional({ example: '2026-06-01T16:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  plannedEndAt?: string;

  @ApiPropertyOptional({ example: 'OP urgente para evento' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'LOTE-0134' })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiPropertyOptional({ example: '2026-06-04T08:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  productionDate?: string;

  @ApiPropertyOptional({ example: '2026-06-05T08:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: '249.200' })
  @IsString()
  @IsOptional()
  batchWeight?: string;
}
