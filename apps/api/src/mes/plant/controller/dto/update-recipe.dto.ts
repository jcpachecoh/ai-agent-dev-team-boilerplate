import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'Pan integral 500g' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'finished-product-uuid' })
  @IsString()
  @IsOptional()
  finishedProductId?: string;

  @ApiPropertyOptional({
    description: 'Batch size (decimal string)',
    example: '10.000',
  })
  @IsNumberString()
  @IsOptional()
  batchSize?: string;

  @ApiPropertyOptional({ enum: StockUnit })
  @IsEnum(StockUnit)
  @IsOptional()
  batchUnit?: StockUnit;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: 'Notas de la receta' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
